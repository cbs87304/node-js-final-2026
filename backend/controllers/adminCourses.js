const { IsNull } = require("typeorm");
const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");

const isHttpsUrl = (value) => typeof value === "string" && value.startsWith("https://");

function computeStatus(course) {
  const now = new Date();
  if (new Date(course.start_at) > now) return "尚未開始";
  if (new Date(course.end_at) <= now) return "已結束";
  return "進行中";
}

function validateCourseBody(body) {
  const { skill_id, name, description, start_at, end_at, max_participants, meeting_url } = body;
  if (
    !isValidString(skill_id) ||
    !isValidString(name) ||
    !isValidString(description) ||
    !isValidString(start_at) ||
    !isValidString(end_at) ||
    !isInteger(max_participants) ||
    max_participants < 0 ||
    !isHttpsUrl(meeting_url)
  ) {
    return false;
  }
  return true;
}

const adminCoursesController = {
  async getAll(req, res, next) {
    const courseRepo = dataSource.getRepository("Course");
    const bookingRepo = dataSource.getRepository("CourseBooking");

    const courses = await courseRepo.find({
      where: { user_id: req.user.id },
      order: { created_at: "DESC" },
    });

    const data = await Promise.all(
      courses.map(async (course) => {
        const participants = await bookingRepo.count({
          where: { course_id: course.id, cancelled_at: IsNull() },
        });
        return {
          id: course.id,
          name: course.name,
          status: computeStatus(course),
          start_at: course.start_at,
          end_at: course.end_at,
          max_participants: course.max_participants,
          meeting_url: course.meeting_url,
          participants,
        };
      }),
    );

    res.json({ status: "success", data });
  },

  async create(req, res, next) {
    if (!validateCourseBody(req.body)) {
      return next(appError(400, "欄位未填寫正確"));
    }
    const { skill_id, name, description, start_at, end_at, max_participants, meeting_url } = req.body;

    const courseRepo = dataSource.getRepository("Course");
    const course = await courseRepo.save({
      user_id: req.user.id,
      skill_id,
      name: name.trim(),
      description: description.trim(),
      start_at,
      end_at,
      max_participants,
      meeting_url,
    });

    res.status(201).json({ status: "success", data: { course } });
  },

  async getOne(req, res, next) {
    const { courseId } = req.params;
    const courseRepo = dataSource.getRepository("Course");
    const course = await courseRepo.findOne({
      where: { id: courseId, user_id: req.user.id },
      relations: { skill: true },
    });
    if (!course) {
      return next(appError(400, "課程不存在"));
    }
    res.json({
      status: "success",
      data: {
        id: course.id,
        name: course.name,
        description: course.description,
        start_at: course.start_at,
        end_at: course.end_at,
        max_participants: course.max_participants,
        skill_name: course.skill.name,
        skill_id: course.skill_id,
        meeting_url: course.meeting_url,
      },
    });
  },

  async updateOne(req, res, next) {
    if (!validateCourseBody(req.body)) {
      return next(appError(400, "欄位未填寫正確"));
    }
    const { courseId } = req.params;
    const { skill_id, name, description, start_at, end_at, max_participants, meeting_url } = req.body;

    const courseRepo = dataSource.getRepository("Course");
    const course = await courseRepo.findOneBy({ id: courseId, user_id: req.user.id });
    if (!course) {
      return next(appError(400, "課程不存在"));
    }

    await courseRepo.update(course.id, {
      skill_id,
      name: name.trim(),
      description: description.trim(),
      start_at,
      end_at,
      max_participants,
      meeting_url,
    });

    const updated = await courseRepo.findOneBy({ id: course.id });
    res.json({ status: "success", data: { course: updated } });
  },
};

module.exports = adminCoursesController;

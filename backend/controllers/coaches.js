const { MoreThan } = require("typeorm");
const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString } = require("../utils/validUtils");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const coachesController = {
  async getList(req, res, next) {
    const { per, page } = req.query;
    const perNum = Number(per);
    const pageNum = Number(page);
    if (
      per === undefined ||
      page === undefined ||
      !Number.isInteger(perNum) ||
      !Number.isInteger(pageNum) ||
      perNum < 0 ||
      pageNum < 1
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const offset = (pageNum - 1) * perNum;
    const coachRepo = dataSource.getRepository("Coach");
    const coaches = await coachRepo.find({
      relations: { user: true },
      order: { created_at: "ASC" },
      take: perNum,
      skip: offset,
    });

    const data = coaches.map((coach) => ({
      id: coach.id,
      user_id: coach.user_id,
      name: coach.user.name,
    }));

    res.json({ status: "success", data });
  },

  async getDetail(req, res, next) {
    const { coachId } = req.params;
    if (!isValidString(coachId) || !UUID_RE.test(coachId)) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const coachRepo = dataSource.getRepository("Coach");
    const coach = await coachRepo.findOne({
      where: { id: coachId },
      relations: { user: true },
    });
    if (!coach) {
      return next(appError(400, "找不到該教練"));
    }

    const linkRepo = dataSource.getRepository("CoachLinkSkill");
    const links = await linkRepo.find({
      where: { coach_id: coach.id },
      relations: { skill: true },
    });

    res.json({
      status: "success",
      data: {
        user: { name: coach.user.name, role: coach.user.role },
        coach: {
          id: coach.id,
          user_id: coach.user_id,
          experience_years: coach.experience_years,
          description: coach.description,
          profile_image_url: coach.profile_image_url,
          created_at: coach.created_at,
          updated_at: coach.updated_at,
          skills: links.map((l) => l.skill.name),
        },
      },
    });
  },

  async getCourses(req, res, next) {
    const { coachId } = req.params;
    if (!isValidString(coachId) || !UUID_RE.test(coachId)) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const coachRepo = dataSource.getRepository("Coach");
    const coach = await coachRepo.findOne({
      where: { id: coachId },
      relations: { user: true },
    });
    if (!coach) {
      return next(appError(400, "找不到該教練"));
    }

    const courseRepo = dataSource.getRepository("Course");
    const courses = await courseRepo.find({
      where: {
        user_id: coach.user_id,
        end_at: MoreThan(new Date()),
      },
      relations: { skill: true },
      order: { start_at: "ASC" },
    });

    const data = courses.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      start_at: c.start_at,
      end_at: c.end_at,
      max_participants: c.max_participants,
      coach_name: coach.user.name,
      skill_name: c.skill.name,
    }));

    res.json({ status: "success", data });
  },
};

module.exports = coachesController;

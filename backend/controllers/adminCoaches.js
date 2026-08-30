const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");

const isHttpsUrl = (value) => typeof value === "string" && value.startsWith("https://");

const adminCoachesController = {
  async promote(req, res, next) {
    const { userId } = req.params;
    const { experience_years, description, profile_image_url } = req.body;

    if (!isInteger(experience_years) || experience_years < 0 || !isValidString(description)) {
      return next(appError(400, "欄位未填寫正確"));
    }
    if (profile_image_url && !isHttpsUrl(profile_image_url)) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const userRepo = dataSource.getRepository("User");
    const user = await userRepo.findOneBy({ id: userId });
    if (!user) {
      return next(appError(400, "使用者不存在"));
    }

    const coachRepo = dataSource.getRepository("Coach");
    const existing = await coachRepo.findOneBy({ user_id: userId });
    if (existing) {
      return next(appError(409, "使用者已經是教練"));
    }

    await userRepo.update(userId, { role: "COACH" });
    const coach = await coachRepo.save({
      user_id: userId,
      experience_years,
      description: description.trim(),
      profile_image_url: profile_image_url || null,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: { name: user.name, role: "COACH" },
        coach,
      },
    });
  },

  async getProfile(req, res, next) {
    const coachRepo = dataSource.getRepository("Coach");
    const coach = await coachRepo.findOneBy({ user_id: req.user.id });

    const linkRepo = dataSource.getRepository("CoachLinkSkill");
    const links = await linkRepo.find({ where: { coach_id: coach.id } });

    res.json({
      status: "success",
      data: {
        id: coach.id,
        experience_years: coach.experience_years,
        description: coach.description,
        profile_image_url: coach.profile_image_url,
        skill_ids: links.map((l) => l.skill_id),
      },
    });
  },

  async putProfile(req, res, next) {
    const { experience_years, description, profile_image_url, skill_ids } = req.body;

    if (!isInteger(experience_years) || experience_years < 0 || !isValidString(description)) {
      return next(appError(400, "欄位未填寫正確"));
    }
    if (!isHttpsUrl(profile_image_url)) {
      return next(appError(400, "欄位未填寫正確"));
    }
    if (!Array.isArray(skill_ids) || skill_ids.length === 0 || !skill_ids.every(isValidString)) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const coachRepo = dataSource.getRepository("Coach");
    const coach = await coachRepo.findOneBy({ user_id: req.user.id });

    await coachRepo.update(coach.id, {
      experience_years,
      description: description.trim(),
      profile_image_url,
    });

    const linkRepo = dataSource.getRepository("CoachLinkSkill");
    await linkRepo.delete({ coach_id: coach.id });
    await linkRepo.save(skill_ids.map((skill_id) => ({ coach_id: coach.id, skill_id })));

    res.json({
      status: "success",
      data: {
        id: coach.id,
        experience_years,
        description: description.trim(),
        profile_image_url,
        skill_ids,
      },
    });
  },
};

module.exports = adminCoachesController;

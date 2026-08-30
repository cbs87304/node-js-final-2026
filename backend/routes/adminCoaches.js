const router = require("express").Router();
const adminCoachesController = require("../controllers/adminCoaches");
const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");

router.post("/:userId", adminCoachesController.promote);
router.get("/", isAuth, isCoach, adminCoachesController.getProfile);
router.put("/", isAuth, isCoach, adminCoachesController.putProfile);

module.exports = router;

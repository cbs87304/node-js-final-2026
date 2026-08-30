const router = require("express").Router();
const coachesController = require("../controllers/coaches");

router.get("/", coachesController.getList);
router.get("/:coachId", coachesController.getDetail);
router.get("/:coachId/courses", coachesController.getCourses);

module.exports = router;

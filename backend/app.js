const express = require("express");
const cors = require("cors");
const config = require("./config");
const { dataSource } = require("./db/data-source");
const appError = require("./utils/appError");
const skill = require("./routes/skill");
const creditPackage = require("./routes/creditPackage");
const users = require("./routes/users");
const adminCourses = require("./routes/adminCourses");
const adminRevenue = require("./routes/adminRevenue");
const adminCoaches = require("./routes/adminCoaches");
const coaches = require("./routes/coaches");
const courses = require("./routes/courses");

const app = express();

// 允許跨網域請求
app.use(cors());
app.use(express.json());

//API
app.get("/healthcheck", async (req, res, next) => {
    try {
        await dataSource.query("SELECT 1");
        res.status(200).send("ok");
    } catch (err) {
        res.status(503).send("Service Unavailable")
    }
});

app.use("/api/coaches/skill", skill); // ① 具體路徑先掛
app.use("/api/credit-package", creditPackage);
app.use("/api/users", users);
app.use("/api/admin/coaches/courses", adminCourses); // ② 具體路徑先掛
app.use("/api/admin/coaches/revenue", adminRevenue); // ③ 具體路徑先掛
app.use("/api/admin/coaches", adminCoaches); // ④ 含 /:userId，後掛
app.use("/api/coaches", coaches); // ⑤ 含 /:coachId，後掛
app.use("/api/courses", courses);

app.use((req, res, next) => {
    // res.status(404).json({
    //     status: "failed",
    //     message: "找不到路由"
    // });
    // new Error
    next(appError(404, "找不到路由"));  
    return;
});

app.use((err,req, res, next) => {
    const statusCode = err.status || 500; // 500 / 401 / 409
    res.status(statusCode).json({
        status: statusCode === 500 ? "error" :"failed",
        message: err.message || "伺服器錯誤"
     });
     return;
});

dataSource
.initialize()
.then(() => {
    app.listen(config.get("web.port"), () => {
        console.log(`Server is running on port ${config.get("web.port")}`);
    });
})
.catch((err) => {
    console.error("資料庫連線失敗", err);
    process.exit(1);
});

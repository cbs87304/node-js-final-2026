const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const adminRevenueController = {
  async getRevenue(req, res, next) {
    const { month } = req.query;
    const monthIndex = MONTH_NAMES.indexOf(month);
    if (monthIndex === -1) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const year = new Date().getFullYear();

    const bookings = await dataSource.query(
      `SELECT cb.user_id FROM course_bookings cb
       JOIN courses c ON c.id = cb.course_id
       WHERE c.user_id = $1 AND cb.cancelled_at IS NULL
         AND EXTRACT(YEAR FROM cb.created_at) = $2
         AND EXTRACT(MONTH FROM cb.created_at) = $3`,
      [req.user.id, year, monthIndex + 1],
    );

    const creditPackageRepo = dataSource.getRepository("CreditPackage");
    const packages = await creditPackageRepo.find();
    const totalPrice = packages.reduce((sum, p) => sum + Number(p.price), 0);
    const totalCredits = packages.reduce((sum, p) => sum + Number(p.credit_amount), 0);
    const perCreditPrice = totalCredits > 0 ? totalPrice / totalCredits : 0;

    const revenue = Math.floor(bookings.length * perCreditPrice);
    const participants = new Set(bookings.map((b) => b.user_id)).size;

    res.json({
      status: "success",
      data: {
        total: {
          revenue,
          participants,
          course_count: bookings.length,
        },
      },
    });
  },
};

module.exports = adminRevenueController;

// utils/appError.js — 統一錯誤格式
const appError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

module.exports = appError;
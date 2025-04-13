const moment = require("moment-timezone");

/**
 * Lấy thời gian hiện tại theo múi giờ Việt Nam (UTC+7)
 * @returns {Date}
 */
function getVietnamTimeNow() {
  return moment().tz("Asia/Ho_Chi_Minh").toDate();
}

/**
 * Chuyển Date (UTC) sang chuỗi giờ Việt Nam định dạng 'YYYY-MM-DD HH:mm:ss'
 * @param {Date} date 
 * @returns {string}
 */
function formatToVietnamTime(date) {
  return moment(date).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
}

/**
 * Chuyển đổi Date UTC sang múi giờ bất kỳ
 * @param {Date} date 
 * @param {string} timezone (ví dụ: 'Asia/Ho_Chi_Minh', 'Asia/Tokyo', 'America/New_York')
 * @returns {string}
 */
function formatToTimezone(date, timezone) {
  return moment(date).tz(timezone).format("YYYY-MM-DD HH:mm:ss");
}

module.exports = {
  getVietnamTimeNow,
  formatToVietnamTime,
  formatToTimezone,
};

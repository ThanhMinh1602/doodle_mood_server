/**
 * Standard API Response Format
 * {
 *   success: boolean,
 *   message: string,
 *   data: any | null,
 *   error: string | null,
 *   statusCode: number
 * }
 */

// Success Response
exports.successResponse = (
  res,
  data = null,
  message = 'Thành công',
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null,
    statusCode,
  });
};

// Error Response
exports.errorResponse = (
  res,
  message = 'Lỗi server',
  statusCode = 500,
  error = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: error?.message || message,
    statusCode,
  });
};

// Validation Error Response
exports.validationError = (res, message = 'Dữ liệu không hợp lệ') => {
  return res.status(400).json({
    success: false,
    message,
    data: null,
    error: message,
    statusCode: 400,
  });
};

// Authentication Error Response
exports.authError = (res, message = 'Không có quyền truy cập') => {
  return res.status(401).json({
    success: false,
    message,
    data: null,
    error: message,
    statusCode: 401,
  });
};

// Not Found Error Response
exports.notFoundError = (res, message = 'Không tìm thấy') => {
  return res.status(404).json({
    success: false,
    message,
    data: null,
    error: message,
    statusCode: 404,
  });
};

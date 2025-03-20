exports.getEmailBody = (otp) => `
         <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Đặt Lại Mật Khẩu</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 30px; text-align: center; background-color: #4a90e2; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Đặt Lại Mật Khẩu</h1>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding: 30px; text-align: center;">
                      <h2 style="color: #333333; font-size: 20px; margin: 0 0 20px;">Xin Chào!</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                        Bạn đã yêu cầu đặt lại mật khẩu. Dưới đây là mã OTP của bạn:
                      </p>
                      <div style="display: inline-block; padding: 15px 25px; background-color: #f0f0f0; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #4a90e2; font-size: 24px; margin: 0; letter-spacing: 2px;">${otp}</h3>
                      </div>
                      <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                        Mã OTP này có hiệu lực trong <strong>15 phút</strong>. Vui lòng sử dụng mã này để đặt lại mật khẩu của bạn.
                      </p>
                      <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 20px 0 0;">
                        Nếu bạn không yêu cầu đặt lại mật khẩu, xin vui lòng bỏ qua email này.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px; text-align: center; background-color: #f9f9f9; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                      <p style="color: #999999; font-size: 14px; margin: 0;">
                        © 2025 DOODLE MOOD.
                      </p>
                      <p style="color:rgb(24, 16, 16); font-size: 14px; margin: 5px 0 0;">
                        Liên hệ hỗ trợ: <a href="https://www.facebook.com/qing.ming.184/" style="color: #4a90e2; text-decoration: none;">Thanh Minh</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

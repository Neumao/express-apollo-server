/**
 * Email template for welcome/verification
 * @param {Object} data Template data
 * @returns {Object} Email content with text and HTML versions
 */
export const welcomeTemplate = (data) => {
    const { name, verificationUrl } = data;

    const text = `
Welcome to our service, ${name || 'User'}!

Please verify your email by clicking on the link below:
${verificationUrl}

This link will expire in 24 hours.

Thank you,
The Team
  `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333333; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    .button {
      display: inline-block;
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      font-size: 0.8em;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Welcome!</h2>
    <p>Hello ${name || 'User'},</p>
    <p>Thank you for signing up with our service. We're excited to have you on board!</p>
    <p>Please verify your email address by clicking the button below:</p>
    
    <a href="${verificationUrl}" class="button">Verify Email</a>
    
    <p>Or copy and paste this link into your browser:</p>
    <p>${verificationUrl}</p>
    
    <p>This link will expire in 24 hours.</p>
    
    <p>If you didn't sign up for an account, you can safely ignore this email.</p>
    
    <div class="footer">
      <p>Thank you,<br>The Team</p>
    </div>
  </div>
</body>
</html>
  `.trim();

    return {
        subject: 'Welcome - Please Verify Your Email',
        text,
        html,
    };
};

/**
 * Email template for password reset
 * @param {Object} data Template data
 * @returns {Object} Email content with text and HTML versions
 */
export const passwordResetTemplate = (data) => {
    const { name, resetUrl } = data;

    const text = `
Password Reset Request

Hello ${name || 'User'},

We received a request to reset your password. If you didn't make this request, you can ignore this email.

To reset your password, click on the link below:
${resetUrl}

This link will expire in 1 hour.

Thank you,
The Team
  `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333333; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    .button {
      display: inline-block;
      background-color: #2196F3;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .warning {
      color: #f44336;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      font-size: 0.8em;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Password Reset</h2>
    <p>Hello ${name || 'User'},</p>
    <p>We received a request to reset your password.</p>
    <p>Click the button below to reset your password:</p>
    
    <a href="${resetUrl}" class="button">Reset Password</a>
    
    <p>Or copy and paste this link into your browser:</p>
    <p>${resetUrl}</p>
    
    <p>This link will expire in 1 hour.</p>
    
    <p class="warning">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
    
    <div class="footer">
      <p>Thank you,<br>The Team</p>
    </div>
  </div>
</body>
</html>
  `.trim();

    return {
        subject: 'Password Reset Request',
        text,
        html,
    };
};

/**
 * Email template for notification
 * @param {Object} data Template data
 * @returns {Object} Email content with text and HTML versions
 */
export const notificationTemplate = (data) => {
    const { name, message, actionUrl, actionText } = data;

    const text = `
${data.subject || 'Notification'}

Hello ${name || 'User'},

${message}

${actionUrl ? `${actionText || 'Click here'}: ${actionUrl}` : ''}

Thank you,
The Team
  `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333333; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    .button {
      display: inline-block;
      background-color: #673AB7;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      font-size: 0.8em;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>${data.subject || 'Notification'}</h2>
    <p>Hello ${name || 'User'},</p>
    <p>${message}</p>
    
    ${actionUrl ? `<a href="${actionUrl}" class="button">${actionText || 'Click here'}</a>` : ''}
    
    <div class="footer">
      <p>Thank you,<br>The Team</p>
    </div>
  </div>
</body>
</html>
  `.trim();

    return {
        subject: data.subject || 'Notification',
        text,
        html,
    };
};
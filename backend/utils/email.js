import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        console.log('Error getting access token:', err);
        reject("Failed to create access token");
      }
      resolve(token);
    });
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_USER,
      accessToken,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
};

export const sendVerificationEmail = async (email, verificationCode, firstName) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Auth System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            Email Verification
          </h2>
          <p>Hello ${firstName},</p>
          <p>Thank you for registering! Use the verification code below to complete your registration:</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="margin: 0; color: #333; letter-spacing: 3px; font-size: 32px;">
              ${verificationCode}
            </h1>
          </div>
          <p>This code will expire in 1 hour.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

export const sendPasswordResetEmail = async (email, resetToken, firstName) => {
  try {
    const transporter = await createTransporter();
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Auth System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            Password Reset
          </h2>
          <p>Hello ${firstName},</p>
          <p>You requested to reset your password. Click the link below to proceed:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" 
               style="background: #667eea; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

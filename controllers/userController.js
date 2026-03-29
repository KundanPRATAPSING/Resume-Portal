const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const validator = require('validator')
const {SECRET} =require('../config/keys')
const bcrypt = require('bcryptjs')

// TEMP DEV BYPASS ADMIN LOGIN
// Remove these before deploying to production.
const DEV_ADMIN_EMAIL = 'lcs2021048@iiitl.ac.in'
const DEV_ADMIN_PASSWORD = 'abcd#123'



const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '12h'
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30)
const LOCKOUT_THRESHOLD = Number(process.env.LOGIN_LOCKOUT_THRESHOLD || 5)
const LOCKOUT_MINUTES = Number(process.env.LOGIN_LOCKOUT_MINUTES || 15)

const createToken = (_id) => {
  return jwt.sign({_id},SECRET, { expiresIn: ACCESS_TOKEN_TTL })
}

const createRefreshToken = (_id) => {
  return jwt.sign({ _id, type: 'refresh' }, SECRET, { expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d` })
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

const attachTokenPair = async (user) => {
  const token = createToken(user._id)
  const refreshToken = createRefreshToken(user._id)
  user.refreshTokenHash = hashToken(refreshToken)
  user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
  await user.save()
  return { token, refreshToken }
}

const createMailTransport = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

const sendResetEmail = async (email, resetLink) => {
  const transporter = createMailTransport()
  if (!transporter) {
    return false
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Reset your Resume Portal password',
    html: `
      <p>You requested a password reset for Resume Portal.</p>
      <p>Click this magic link to reset your password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `
  })
  return true
}


// login a user
const loginUser = async (req, res) => {
  const {email, password,role} = req.body

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable. Please try again in a moment.' })
    }

    // Development-only bypass: disabled by default for production safety.
    const allowDevBypass = process.env.ENABLE_DEV_ADMIN_BYPASS === 'true'
    if (allowDevBypass && role === 'admin' && email === DEV_ADMIN_EMAIL && password === DEV_ADMIN_PASSWORD) {
      let user = await User.findOne({ email: DEV_ADMIN_EMAIL })

      if (!user) {
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(DEV_ADMIN_PASSWORD, salt)
        user = await User.create({
          email: DEV_ADMIN_EMAIL,
          password: hash,
          role: 'admin'
        })
      } else if (user.role !== 'admin') {
        user.role = 'admin'
        await user.save()
      }

      user.failedLoginAttempts = 0
      user.lockUntil = undefined
      const { token, refreshToken } = await attachTokenPair(user)
      return res.status(200).json({ _id: user._id, email: user.email, token, refreshToken, role: 'admin' })
    }

    let user;
    if (role == 'admin') {
       user = await User.login(email, password,role);
    } else if (role == 'user') {
       user = await User.login(email, password,role);
    } else {
      throw new Error('Invalid role');
    }
    user.failedLoginAttempts = 0
    user.lockUntil = undefined
    await user.save()
    // create a token
    const { token, refreshToken } = await attachTokenPair(user)

    res.status(200).json({_id: user._id, email, token, refreshToken, role})
  } catch (error) {
    try {
      if (email) {
        const existing = await User.findOne({ email })
        if (existing) {
          existing.failedLoginAttempts = (existing.failedLoginAttempts || 0) + 1
          if (existing.failedLoginAttempts >= LOCKOUT_THRESHOLD) {
            existing.lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
            existing.failedLoginAttempts = 0
          }
          await existing.save()
        }
      }
    } catch (e) {
      // no-op lockout update failure
    }
    res.status(400).json({error: error.message})
  }
}

// signup a user
const signupUser = async (req, res) => {
  const {email, password,role} = req.body

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable. Please try again in a moment.' })
    }

    const user = await User.signup(email, password,role)

    // create a token
    const { token, refreshToken } = await attachTokenPair(user)

    res.status(200).json({_id: user._id, email, token, refreshToken, role})
  } catch (error) {
    res.status(400).json({error: error.message})
  }
}

const rotateToken = async (req, res) => {
  const { refreshToken } = req.body
  try {
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required.' })
    const decoded = jwt.verify(refreshToken, SECRET)
    if (decoded.type !== 'refresh') return res.status(401).json({ error: 'Invalid token type.' })

    const user = await User.findById(decoded._id)
    if (!user) return res.status(401).json({ error: 'Invalid refresh token.' })
    if (!user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
      return res.status(401).json({ error: 'Refresh token mismatch.' })
    }
    if (!user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token expired.' })
    }

    const tokenPair = await attachTokenPair(user)
    res.status(200).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token: tokenPair.token,
      refreshToken: tokenPair.refreshToken
    })
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token.' })
  }
}

const logoutUser = async (req, res) => {
  try {
    if (!req.body.email) return res.status(200).json({ message: 'Logged out.' })
    const user = await User.findOne({ email: req.body.email })
    if (user) {
      user.refreshTokenHash = undefined
      user.refreshTokenExpiresAt = undefined
      await user.save()
    }
    res.status(200).json({ message: 'Logged out.' })
  } catch (error) {
    res.status(200).json({ message: 'Logged out.' })
  }
}

const forgotPassword = async (req, res) => {
  const { email } = req.body

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable. Please try again in a moment.' })
    }

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      // Avoid revealing which emails are registered.
      return res.status(200).json({ message: 'If this email is registered, a reset link has been sent.' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    user.passwordResetToken = hashedToken
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000
    await user.save()

    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:3000'
    const resetLink = `${clientBaseUrl}/reset-password/${resetToken}`
    const emailSent = await sendResetEmail(email, resetLink)
    if (!emailSent) {
      console.log('SMTP not configured. Password reset link:', resetLink)
      return res.status(200).json({
        message: 'Email service is not configured yet. Use this reset link for development.',
        resetLink
      })
    }

    res.status(200).json({ message: 'If this email is registered, a reset link has been sent.' })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to send reset link right now.' })
  }
}

const resetPassword = async (req, res) => {
  const { token } = req.params
  const { password } = req.body

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable. Please try again in a moment.' })
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required.' })
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({ error: 'Password not strong enough.' })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({ error: 'Reset link is invalid or expired.' })
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    res.status(200).json({ message: 'Password reset successful. You can log in now.' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = { signupUser, loginUser, forgotPassword, resetPassword, rotateToken, logoutUser }
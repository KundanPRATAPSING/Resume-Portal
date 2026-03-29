const express = require('express')

// controller functions
const {
  loginUser,
  signupUser,
  forgotPassword,
  resetPassword,
  rotateToken,
  logoutUser
} = require('../controllers/userController')

const router = express.Router()

// login  the user
router.post('/login', loginUser)

// signup the uer
router.post('/signup', signupUser)

// forgot password (magic link email)
router.post('/forgot-password', forgotPassword)

// reset password using magic link token
router.post('/reset-password/:token', resetPassword)
router.post('/refresh-token', rotateToken)
router.post('/logout', logoutUser)

module.exports = router
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const validator = require('validator')

const Schema = mongoose.Schema

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role:{
    type: String,
    required: true
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },
  notificationLastReadAt: {
    type: Date
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  refreshTokenHash: {
    type: String
  },
  refreshTokenExpiresAt: {
    type: Date
  }
})

// static signup method
userSchema.statics.signup = async function(email, password,role) {

  // validation
  if (!email || !password || !role) {
    throw Error('All fields must be filled')
  }
  if (!validator.isEmail(email)) {
    throw Error('Email not valid')
  }
  if (!validator.isStrongPassword(password)) {
    throw Error('Password not strong enough')
  }

  const exists = await this.findOne({ email })

  if (exists) {
    throw Error('Email already in use')
  }

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)

  const user = await this.create({ email, password: hash,role })

  return user
}

// static login method
userSchema.statics.login = async function(email, password,role) {

  if (!email || !password || !role) {
    throw Error('All fields must be filled')
  }

  const user = await this.findOne({ email })
  if (!user) {
    throw Error('Incorrect email')
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    throw Error('Account temporarily locked due to multiple failed attempts. Try again later.')
  }

  const match = await bcrypt.compare(password, user.password)
  let match2=0;
  if(user.role===role){
      match2=1;
  }
  if (!match || !match2) {
    throw Error('Incorrect password')
  }
  return user
}






module.exports = mongoose.model('User', userSchema)
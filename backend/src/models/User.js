import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  fullName:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 8 },
  profilePic: { type: String, default: '' },
  bio:        { type: String, default: '', maxlength: 200 },
  isVerified: { type: Boolean, default: false },

  // Password reset
  resetPasswordToken:   String,
  resetPasswordExpires: Date,

  // Email verification
  emailVerifyToken:   String,
  emailVerifyExpires: Date,
}, { timestamps: true })

// Hash password before save
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

// Compare password
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Return safe user (no password)
userSchema.methods.toSafeObject = function() {
  const obj = this.toObject()
  delete obj.password
  delete obj.resetPasswordToken
  delete obj.resetPasswordExpires
  delete obj.emailVerifyToken
  delete obj.emailVerifyExpires
  return obj
}

const User = mongoose.model('User', userSchema)
export default User
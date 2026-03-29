const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { v2: cloudinary } = require('cloudinary')

const provider = process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
  ? 'cloudinary'
  : 'local'

if (provider === 'cloudinary') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })
}

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

const uploadBuffer = async ({ buffer, folder, fileName, mimeType, req }) => {
  if (provider === 'cloudinary') {
    const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`
    const result = await cloudinary.uploader.upload(base64, {
      folder,
      public_id: `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9-_]/g, '_')}`,
      resource_type: 'auto',
      overwrite: false
    })
    return {
      provider,
      fileUrl: result.secure_url,
      publicId: result.public_id
    }
  }

  const targetDir = path.join(__dirname, '..', 'uploads', folder)
  ensureDir(targetDir)
  const ext = path.extname(fileName) || ''
  const safeBase = path.basename(fileName, ext).replace(/[^a-zA-Z0-9-_]/g, '_')
  const storedName = `${Date.now()}-${safeBase}${ext}`
  const filePath = path.join(targetDir, storedName)
  fs.writeFileSync(filePath, buffer)

  return {
    provider,
    fileUrl: `${req.protocol}://${req.get('host')}/uploads/${folder}/${storedName}`,
    publicId: storedName
  }
}

const deleteObject = async ({ folder, publicId, fileUrl }) => {
  if (!publicId && !fileUrl) return
  if (provider === 'cloudinary') {
    const cloudId = publicId || fileUrl
    await cloudinary.uploader.destroy(cloudId, { resource_type: 'auto' })
    return
  }
  const fileName = publicId || (fileUrl ? fileUrl.split(`/uploads/${folder}/`)[1] : null)
  if (!fileName) return
  const filePath = path.join(__dirname, '..', 'uploads', folder, fileName)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

const getSignedReadUrl = ({ folder, publicId, fileUrl, expiresInSeconds = 300, req }) => {
  if (provider === 'cloudinary' && publicId) {
    return cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds
    })
  }
  if (!fileUrl) return null
  const fileName = publicId || fileUrl.split(`/uploads/${folder}/`)[1]
  if (!fileName) return fileUrl
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds
  const signature = crypto
    .createHmac('sha256', process.env.FILE_URL_SIGNING_SECRET || 'local-dev-secret')
    .update(`${folder}:${fileName}:${exp}`)
    .digest('hex')
  const base = req ? `${req.protocol}://${req.get('host')}` : ''
  return `${base}/api/files/signed?folder=${encodeURIComponent(folder)}&file=${encodeURIComponent(fileName)}&exp=${exp}&sig=${signature}`
}

const verifySignature = ({ folder, file, exp, sig }) => {
  if (!folder || !file || !exp || !sig) return false
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false
  const expected = crypto
    .createHmac('sha256', process.env.FILE_URL_SIGNING_SECRET || 'local-dev-secret')
    .update(`${folder}:${file}:${exp}`)
    .digest('hex')
  return expected === sig
}

module.exports = { provider, uploadBuffer, deleteObject, getSignedReadUrl, verifySignature }

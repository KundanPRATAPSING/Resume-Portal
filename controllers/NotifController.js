const Notification = require('../models/notifModel');
const User = require('../models/userModel');
const Data = require('../models/dataModel');

const normalizeStringArray = (arr = []) => {
  if (!Array.isArray(arr)) return []
  return [...new Set(arr.map((x) => String(x || '').trim()).filter(Boolean))]
}

const normalizeNumberArray = (arr = []) => {
  if (!Array.isArray(arr)) return []
  return [...new Set(arr.map((x) => Number(x)).filter((x) => !Number.isNaN(x)))]
}


const Notification_getallNotifis = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1)
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100)
    const skip = (page - 1) * limit
    const search = String(req.query.search || '').trim()

    const filter = {}
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const [allNotifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter)
    ])

    if (req.user.role === 'admin') {
      return res.json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        items: allNotifications
      })
    }

    const studentProfile = await Data.findOne({ user_id: req.user._id }).select('Branch BatchYear')
    const studentBranch = studentProfile?.Branch
    const studentBatch = studentProfile?.BatchYear
    const studentRole = req.user.role

    const visible = allNotifications.filter((item) => {
      const roles = normalizeStringArray(item.targetRoles)
      const branches = normalizeStringArray(item.targetBranches)
      const batchYears = normalizeNumberArray(item.targetBatchYears)

      const roleMatch = roles.length === 0 || roles.includes(studentRole)
      const branchMatch = branches.length === 0 || (studentBranch && branches.includes(studentBranch))
      const batchMatch = batchYears.length === 0 || (studentBatch !== undefined && batchYears.includes(Number(studentBatch)))

      return roleMatch && branchMatch && batchMatch
    })

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items: visible
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

const Notification_create_post = (req, res) => {
  const payload = {
    ...req.body,
    targetRoles: normalizeStringArray(req.body.targetRoles || []),
    targetBranches: normalizeStringArray(req.body.targetBranches || []),
    targetBatchYears: normalizeNumberArray(req.body.targetBatchYears || [])
  }
  const notification = new Notification(payload);
  notification.save()
    .then(result => {
      res.json(result)
      console.log("Notification Added")
    })
    .catch(err => {
        res.status(400).json({ error: err.message })
    });
}

const Notification_delete = (req, res) => {
  const id = req.params.id;
    Notification.findByIdAndDelete(id)
    .then(result => {
      res.json(result)
      console.log("Notification Deleted")
    })
    .catch(err => {
        res.status(400).json({ error: err.message })
    });
}

const Notification_unread_count = async (req, res) => {
  try {
    // Admin can create/delete notifications, badge is for end users.
    if (req.user.role === 'admin') {
      return res.status(200).json({ count: 0 });
    }

    const dbUser = await User.findById(req.user._id).select('notificationLastReadAt');
    const lastReadAt = dbUser?.notificationLastReadAt;
    const studentProfile = await Data.findOne({ user_id: req.user._id }).select('Branch BatchYear')
    const studentBranch = studentProfile?.Branch
    const studentBatch = studentProfile?.BatchYear
    const studentRole = req.user.role
    const filter = lastReadAt ? { createdAt: { $gt: lastReadAt } } : {}

    const notifications = await Notification.find(filter)
    const count = notifications.filter((item) => {
      const roles = normalizeStringArray(item.targetRoles)
      const branches = normalizeStringArray(item.targetBranches)
      const batchYears = normalizeNumberArray(item.targetBatchYears)

      const roleMatch = roles.length === 0 || roles.includes(studentRole)
      const branchMatch = branches.length === 0 || (studentBranch && branches.includes(studentBranch))
      const batchMatch = batchYears.length === 0 || (studentBatch !== undefined && batchYears.includes(Number(studentBatch)))

      return roleMatch && branchMatch && batchMatch
    }).length

    res.status(200).json({ count });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

const Notification_mark_read = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(200).json({ message: 'No unread notifications for admin.' });
    }

    await User.findByIdAndUpdate(req.user._id, { notificationLastReadAt: new Date() });
    res.status(200).json({ message: 'Notifications marked as read.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
    Notification_getallNotifis, 
  Notification_create_post, 
  Notification_delete,
  Notification_unread_count,
  Notification_mark_read
}
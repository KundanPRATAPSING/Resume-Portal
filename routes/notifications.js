const express = require('express')

const NotifiController = require('../controllers/NotifController')
const requireAuth = require('../middleware/requireAuth')

  const router = express.Router()
  
  // require auth for all Notifi routes
  router.use(requireAuth)
  
  // GET ALL NOtiFICATIONS FOR Students

  router.get('/',NotifiController.Notification_getallNotifis);

  // GET unread notification count for badge
  router.get('/unreadcount', NotifiController.Notification_unread_count)

  // mark notifications as read for current user
  router.post('/mark-read', NotifiController.Notification_mark_read)
  

  // POST a new Notifications
  router.post('/create', NotifiController.Notification_create_post)
  
  // DELETE a Notifications
  router.delete('/:id', NotifiController.Notification_delete )

module.exports = router
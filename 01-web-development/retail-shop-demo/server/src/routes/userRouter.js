import express from 'express'
import accessLevel from '../middleware/accessLevel.js'
import { Notifications } from '../db/models.js'
import {
  getAllProducts,
  scanProduct,
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  processPayment,
  getUserReceipts,
  getReceiptById,
  getBonusCard,
  createBonusCard,
  sendMessage,
  getMessages,
  getProfile,
  createOrder,
  getUserOrders,
} from '../controllers/controller.js'

const router = express.Router()
router.use(accessLevel(1))

router.get('/profile', getProfile)
router.get('/products', getAllProducts)
router.post('/scan', scanProduct)

router.get('/cart', getCart)
router.post('/cart', addToCart)
router.put('/cart', updateCartQuantity)
router.delete('/cart/:productId', removeFromCart)
router.delete('/cart', clearCart)

router.get('/bonus', getBonusCard)
router.post('/bonus', createBonusCard)

router.post('/pay', processPayment)
router.get('/receipts', getUserReceipts)
router.get('/receipt/:id', getReceiptById)

router.post('/messages', sendMessage)
router.get('/messages', getMessages)

router.post('/orders', createOrder)
router.get('/orders', getUserOrders)

router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notifications.findAll({
      where: { user_id: req.user.user_id },
      order: [['createdAt', 'DESC']],
    })
    res.json({ data: notifications })
  } catch (error) {
    console.error('Notification loading error:', error.message)
    res.status(500).json({ error: 'Ошибка получения уведомлений' })
  }
})

router.post('/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notifications.findOne({
      where: { notification_id: req.params.id, user_id: req.user.user_id },
    })
    if (!notification) return res.status(404).json({ error: 'Уведомление не найдено' })

    notification.read = true
    await notification.save()
    res.json({ data: notification })
  } catch (error) {
    console.error('Notification update error:', error.message)
    res.status(500).json({ error: 'Ошибка обновления уведомления' })
  }
})

export default router

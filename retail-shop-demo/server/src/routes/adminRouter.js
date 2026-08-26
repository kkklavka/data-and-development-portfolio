import express from 'express'
import accessLevel from '../middleware/accessLevel.js'
import {
  getAllUsers,
  getAllProducts,
  getProductById,
  createReceipt,
  getReceiptById,
  getAllReceipts,
  sendMessage,
  getMessages,
  getBonusCardByNumber,
  getAdminOrders,
  updateOrderStatus,
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  updateCartQuantity,
  processPayment,
} from '../controllers/controller.js'

const router = express.Router()
router.use(accessLevel(2))

router.get('/users', getAllUsers)
router.get('/products', getAllProducts)
router.get('/products/:id', getProductById)

router.post('/receipt', createReceipt)
router.get('/receipts/:id', getReceiptById)
router.get('/receipts', getAllReceipts)

router.get('/cart', getCart)
router.post('/cart', addToCart)
router.put('/cart', updateCartQuantity)
router.delete('/cart/:productId', removeFromCart)
router.delete('/cart', clearCart)

router.post('/messages', sendMessage)
router.get('/messages', getMessages)
router.get('/bonus/:card_number', getBonusCardByNumber)

router.get('/orders', getAdminOrders)
router.put('/orders/:id', updateOrderStatus)
router.post('/pay', processPayment)

export default router

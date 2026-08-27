import { Op } from 'sequelize'
import {
  sequelize,
  Users,
  Products,
  Receipts,
  ReceiptItems,
  BonusCards,
  Messages,
  CartItem,
  Notifications,
  Orders,
  OrderItems,
} from '../db/models.js'

const productInclude = { model: Products, as: 'Product', required: false }
const receiptItemsInclude = {
  model: ReceiptItems,
  as: 'ReceiptItems',
  include: [{ model: Products, as: 'Product' }],
}
const orderItemsInclude = {
  model: OrderItems,
  as: 'OrderItems',
  include: [{ model: Products, as: 'Product' }],
}

export const getProfile = async (req, res) => {
  const user = req.user
  res.json({
    user_id: user.user_id,
    email: user.email,
    access_level: user.access_level,
    first_name: user.first_name,
    last_name: user.last_name,
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
  })
}

export const scanProduct = async (req, res) => {
  try {
    const barcode = Number(req.body.barcode)
    if (!Number.isInteger(barcode) || barcode <= 0) {
      return res.status(400).json({ error: 'Некорректный код товара' })
    }
    const product = await Products.findByPk(barcode)
    if (!product) return res.status(404).json({ error: 'Товар не найден' })
    res.json(product)
  } catch (error) {
    console.error('Product scan error:', error.message)
    res.status(500).json({ error: 'Ошибка при сканировании товара' })
  }
}

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.user_id
    const productId = Number(req.body.product_id)
    const increment = Math.max(1, Number(req.body.quantity) || 1)

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Некорректный товар' })
    }

    const product = await Products.findByPk(productId)
    if (!product) return res.status(404).json({ error: 'Товар не найден' })

    const [item, created] = await CartItem.findOrCreate({
      where: { user_id: userId, product_id: productId },
      defaults: { quantity: increment },
    })
    if (!created) {
      item.quantity += increment
      await item.save()
    }

    const cart = await CartItem.findAll({ where: { user_id: userId }, include: [productInclude] })
    res.json({ cart })
  } catch (error) {
    console.error('Add-to-cart error:', error.message)
    res.status(500).json({ error: 'Ошибка при добавлении товара в корзину' })
  }
}

export const getCart = async (req, res) => {
  try {
    const cart = await CartItem.findAll({
      where: { user_id: req.user.user_id },
      include: [productInclude],
      order: [['cart_item_id', 'ASC']],
    })
    res.json({ cart })
  } catch (error) {
    console.error('Cart loading error:', error.message)
    res.status(500).json({ error: 'Ошибка получения корзины' })
  }
}

export const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.user.user_id
    const productId = Number(req.body.product_id)
    const quantity = Number(req.body.quantity)

    if (!Number.isInteger(productId) || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Некорректные данные' })
    }

    const cartItem = await CartItem.findOne({ where: { user_id: userId, product_id: productId } })
    if (!cartItem) return res.status(404).json({ error: 'Товар не найден в корзине' })

    if (quantity <= 0) await cartItem.destroy()
    else {
      cartItem.quantity = quantity
      await cartItem.save()
    }

    const cart = await CartItem.findAll({ where: { user_id: userId }, include: [productInclude] })
    res.json({ cart })
  } catch (error) {
    console.error('Cart update error:', error.message)
    res.status(500).json({ error: 'Ошибка обновления корзины' })
  }
}

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.user_id
    const productId = Number(req.params.productId)
    const deleted = await CartItem.destroy({ where: { user_id: userId, product_id: productId } })
    if (!deleted) return res.status(404).json({ error: 'Товар не найден в корзине' })
    res.json({ message: 'Товар удалён из корзины' })
  } catch (error) {
    console.error('Cart item removal error:', error.message)
    res.status(500).json({ error: 'Ошибка удаления из корзины' })
  }
}

export const clearCart = async (req, res) => {
  try {
    await CartItem.destroy({ where: { user_id: req.user.user_id } })
    res.json({ message: 'Корзина очищена' })
  } catch (error) {
    console.error('Cart clearing error:', error.message)
    res.status(500).json({ error: 'Ошибка очистки корзины' })
  }
}

export const processPayment = async (req, res) => {
  try {
    const userId = req.user.user_id
    const requestedBonus = Math.max(0, Number(req.body.use_bonus) || 0)
    const bonusCardNumber = String(req.body.bonus_card_number || '').trim()

    const cartItems = await CartItem.findAll({
      where: { user_id: userId },
      include: [productInclude],
    })
    const validItems = cartItems.filter((item) => item.Product)
    if (!validItems.length) {
      return res.status(400).json({ error: 'Корзина пуста' })
    }

    let bonusCard = null
    if (bonusCardNumber) {
      bonusCard = await BonusCards.findOne({ where: { card_number: bonusCardNumber } })
      if (!bonusCard) return res.status(404).json({ error: 'Бонусная карта не найдена' })
      if (req.user.access_level === 1 && bonusCard.user_id !== userId) {
        return res.status(403).json({ error: 'Эта бонусная карта принадлежит другому пользователю' })
      }
    }

    const subtotal = validItems.reduce(
      (sum, item) => sum + item.quantity * item.Product.price,
      0
    )
    const appliedBonus = bonusCard
      ? Math.min(requestedBonus, bonusCard.balance, subtotal)
      : 0
    const total = subtotal - appliedBonus
    const earnedBonus = bonusCard ? Math.floor(total * 0.05) : 0

    const receipt = await sequelize.transaction(async (transaction) => {
      const created = await Receipts.create({
        user_id: bonusCard?.user_id || userId,
        bonus_card_id: bonusCard?.card_id || null,
        total,
        bonus_used: appliedBonus,
        bonus_added: earnedBonus,
      }, { transaction })

      await ReceiptItems.bulkCreate(validItems.map((item) => ({
        receipt_id: created.receipt_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.Product.price,
      })), { transaction })

      await CartItem.destroy({ where: { user_id: userId }, transaction })

      if (bonusCard) {
        bonusCard.balance = bonusCard.balance - appliedBonus + earnedBonus
        await bonusCard.save({ transaction })
      }

      return created
    })

    res.json({
      message: 'Платёж успешно обработан',
      receipt,
      bonus_info: bonusCard
        ? { used: appliedBonus, earned: earnedBonus, balance: bonusCard.balance }
        : null,
    })
  } catch (error) {
    console.error('Payment error:', error.message)
    res.status(500).json({ error: 'Ошибка при оплате' })
  }
}

export const getBonusCard = async (req, res) => {
  try {
    const card = await BonusCards.findOne({ where: { user_id: req.user.user_id } })
    if (!card) return res.status(404).json({ error: 'Бонусная карта не найдена' })
    res.json({ bonus_card: card })
  } catch (error) {
    console.error('Bonus card loading error:', error.message)
    res.status(500).json({ error: 'Ошибка получения бонусной карты' })
  }
}

export const createBonusCard = async (req, res) => {
  try {
    const userId = req.user.user_id
    const phone = String(req.body.phone || '').trim()
    if (!phone) return res.status(400).json({ error: 'Укажите номер телефона' })

    const existing = await BonusCards.findOne({ where: { user_id: userId } })
    if (existing) return res.status(409).json({ error: 'Бонусная карта уже существует' })

    const card = await BonusCards.create({
      user_id: userId,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      phone,
    })
    res.status(201).json({ bonus_card: card })
  } catch (error) {
    console.error('Bonus card creation error:', error.message)
    res.status(500).json({ error: 'Ошибка создания бонусной карты' })
  }
}

export const getBonusCardByNumber = async (req, res) => {
  try {
    const cardNumber = String(req.params.card_number || '').trim()
    if (!cardNumber) return res.status(400).json({ message: 'Номер карты не указан' })

    const card = await BonusCards.findOne({
      where: { card_number: cardNumber },
      include: [{ model: Users, as: 'User', attributes: ['user_id', 'first_name', 'last_name'] }],
    })
    if (!card) return res.status(404).json({ message: 'Карта не найдена' })
    res.json({ bonus_card: card })
  } catch (error) {
    console.error('Bonus card search error:', error.message)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

export const getUserReceipts = async (req, res) => {
  try {
    const receipts = await Receipts.findAll({
      where: { user_id: req.user.user_id },
      order: [['createdAt', 'DESC']],
      include: [receiptItemsInclude],
    })
    res.json({ receipts })
  } catch (error) {
    console.error('Receipt history error:', error.message)
    res.status(500).json({ error: 'Ошибка получения чеков' })
  }
}

export const getReceiptById = async (req, res) => {
  try {
    const receipt = await Receipts.findByPk(req.params.id, { include: [receiptItemsInclude] })
    if (!receipt) return res.status(404).json({ error: 'Чек не найден' })
    if (req.user.access_level === 1 && receipt.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Недостаточно прав' })
    }
    res.json(receipt)
  } catch (error) {
    console.error('Receipt loading error:', error.message)
    res.status(500).json({ error: 'Ошибка получения чека' })
  }
}

export const getAllReceipts = async (req, res) => {
  try {
    const receipts = await Receipts.findAll({
      include: [receiptItemsInclude],
      order: [['createdAt', 'DESC']],
    })
    res.json(receipts)
  } catch (error) {
    console.error('Receipt list error:', error.message)
    res.status(500).json({ error: 'Ошибка получения чеков' })
  }
}

export const createReceipt = async (req, res) => {
  try {
    const userId = Number(req.body.user_id) || req.user.user_id
    const items = Array.isArray(req.body.items) ? req.body.items : []
    if (!items.length) return res.status(400).json({ error: 'Добавьте товары в чек' })

    const productIds = items.map((item) => Number(item.product_id)).filter(Number.isInteger)
    const products = await Products.findAll({ where: { product_id: productIds } })
    const productMap = new Map(products.map((product) => [product.product_id, product]))

    const normalizedItems = items.map((item) => {
      const product = productMap.get(Number(item.product_id))
      const quantity = Math.max(1, Number(item.quantity) || 1)
      return product ? { product, quantity } : null
    }).filter(Boolean)

    if (!normalizedItems.length) return res.status(400).json({ error: 'Товары не найдены' })

    const total = normalizedItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )

    const receipt = await sequelize.transaction(async (transaction) => {
      const created = await Receipts.create({ user_id: userId, total }, { transaction })
      await ReceiptItems.bulkCreate(normalizedItems.map(({ product, quantity }) => ({
        receipt_id: created.receipt_id,
        product_id: product.product_id,
        quantity,
        price: product.price,
      })), { transaction })
      return created
    })

    res.status(201).json({ success: true, receipt_id: receipt.receipt_id })
  } catch (error) {
    console.error('Receipt creation error:', error.message)
    res.status(500).json({ error: 'Ошибка создания чека' })
  }
}

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.user_id
    const content = String(req.body.content || '').trim()
    const contentType = Number(req.body.content_type) || 0
    if (!content) return res.status(400).json({ error: 'Сообщение не может быть пустым' })

    let receiverId = Number(req.body.receiver_id) || null
    if (req.user.access_level === 1) {
      const staff = await Users.findOne({
        where: { access_level: { [Op.gte]: 2 } },
        order: [['access_level', 'DESC'], ['user_id', 'ASC']],
      })
      if (!staff) return res.status(503).json({ error: 'Поддержка пока недоступна' })
      receiverId = staff.user_id
    }

    if (!receiverId) return res.status(400).json({ error: 'Получатель не указан' })
    const receiver = await Users.findByPk(receiverId)
    if (!receiver) return res.status(404).json({ error: 'Получатель не найден' })

    const message = await Messages.create({
      sender_id: senderId,
      receiver_id: receiverId,
      content_type: contentType,
      content,
    })

    const io = req.app.get('io')
    if (io) {
      io.to(`user_${senderId}`).to(`user_${receiverId}`).emit('newMessage', message)
    }

    res.status(201).json(message)
  } catch (error) {
    console.error('Message sending error:', error.message)
    res.status(500).json({ error: 'Ошибка отправки сообщения' })
  }
}

export const getMessages = async (req, res) => {
  try {
    const userId = req.user.user_id
    const where = req.user.access_level === 1
      ? { [Op.or]: [{ sender_id: userId }, { receiver_id: userId }] }
      : undefined

    const messages = await Messages.findAll({
      where,
      order: [['createdAt', 'ASC']],
      include: [
        { model: Users, as: 'Sender', attributes: ['user_id', 'first_name', 'last_name', 'access_level'] },
        { model: Users, as: 'Receiver', attributes: ['user_id', 'first_name', 'last_name', 'access_level'] },
      ],
    })
    res.json(messages)
  } catch (error) {
    console.error('Message history error:', error.message)
    res.status(500).json({ error: 'Ошибка получения сообщений' })
  }
}

export const getAllUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: ['user_id', 'email', 'first_name', 'last_name', 'access_level', 'createdAt'],
      order: [['user_id', 'ASC']],
    })
    res.json(users)
  } catch (error) {
    console.error('User list error:', error.message)
    res.status(500).json({ error: 'Ошибка получения пользователей' })
  }
}

export const getAllProducts = async (req, res) => {
  try {
    const products = await Products.findAll({ order: [['product_id', 'ASC']] })
    res.json(products)
  } catch (error) {
    console.error('Product list error:', error.message)
    res.status(500).json({ error: 'Ошибка получения товаров' })
  }
}

export const getProductById = async (req, res) => {
  try {
    const product = await Products.findByPk(req.params.id)
    if (!product) return res.status(404).json({ error: 'Товар не найден' })
    res.json(product)
  } catch (error) {
    console.error('Product loading error:', error.message)
    res.status(500).json({ error: 'Ошибка получения товара' })
  }
}

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.user_id
    const phone = String(req.body.phone || '').trim()
    if (!phone) return res.status(400).json({ error: 'Укажите номер телефона' })

    const cartItems = await CartItem.findAll({
      where: { user_id: userId },
      include: [productInclude],
    })
    const validItems = cartItems.filter((item) => item.Product)
    if (!validItems.length) return res.status(400).json({ error: 'Корзина пуста' })

    const total = validItems.reduce(
      (sum, item) => sum + item.quantity * item.Product.price,
      0
    )

    const order = await sequelize.transaction(async (transaction) => {
      const created = await Orders.create({
        user_id: userId,
        status: 'новый',
        total,
        contact_phone: phone,
        contact_name: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim(),
      }, { transaction })

      await OrderItems.bulkCreate(validItems.map((item) => ({
        order_id: created.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.Product.price,
      })), { transaction })

      await CartItem.destroy({ where: { user_id: userId }, transaction })
      await Notifications.create({
        user_id: userId,
        message: `Заказ #${created.order_id} принят в обработку`,
      }, { transaction })

      return created
    })

    res.status(201).json({ message: 'Заказ создан', order })
  } catch (error) {
    console.error('Order creation error:', error.message)
    res.status(500).json({ error: 'Ошибка создания заказа' })
  }
}

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Orders.findAll({
      where: { user_id: req.user.user_id },
      include: [orderItemsInclude],
      order: [['createdAt', 'DESC']],
    })
    res.json({ orders })
  } catch (error) {
    console.error('Order history error:', error.message)
    res.status(500).json({ error: 'Ошибка получения заказов' })
  }
}

export const getAdminOrders = async (req, res) => {
  try {
    const orders = await Orders.findAll({
      include: [
        { model: Users, as: 'User', attributes: ['user_id', 'email', 'first_name', 'last_name'] },
        orderItemsInclude,
      ],
      order: [['createdAt', 'DESC']],
    })
    res.json({ orders })
  } catch (error) {
    console.error('Admin order list error:', error.message)
    res.status(500).json({ error: 'Ошибка получения заказов' })
  }
}

export const updateOrderStatus = async (req, res) => {
  try {
    const status = String(req.body.status || '').trim()
    const allowedStatuses = ['новый', 'собирается', 'собран', 'выдан', 'отменён']
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Некорректный статус заказа' })
    }

    const order = await Orders.findByPk(req.params.id)
    if (!order) return res.status(404).json({ error: 'Заказ не найден' })

    order.status = status
    await order.save()
    await Notifications.create({
      user_id: order.user_id,
      message: `Статус заказа #${order.order_id}: ${status}`,
    })

    res.json({ message: 'Статус заказа обновлён', order })
  } catch (error) {
    console.error('Order status update error:', error.message)
    res.status(500).json({ error: 'Ошибка обновления статуса' })
  }
}

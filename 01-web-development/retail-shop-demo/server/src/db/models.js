import { DataTypes } from 'sequelize'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import sequelize from './index.js'

const Users = sequelize.define('users', {
  user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  access_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { isIn: [[1, 2, 3]] },
  },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  first_name: { type: DataTypes.STRING },
  last_name: { type: DataTypes.STRING },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) user.password = await bcrypt.hash(user.password, 10)
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) user.password = await bcrypt.hash(user.password, 10)
    },
  },
})

Users.prototype.comparePassword = function (password) {
  return bcrypt.compare(password, this.password)
}

const Products = sequelize.define('products', {
  product_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  price: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
})

const CartItem = sequelize.define('cart_items', {
  cart_item_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Users, key: 'user_id' },
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Products, key: 'product_id' },
  },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1 } },
}, {
  timestamps: false,
  indexes: [{ unique: true, fields: ['user_id', 'product_id'] }],
})

const BonusCards = sequelize.define('bonus_cards', {
  card_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: Users, key: 'user_id' },
  },
  card_number: { type: DataTypes.STRING, unique: true, allowNull: false },
  balance: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
  first_name: { type: DataTypes.STRING },
  last_name: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
}, {
  hooks: {
    beforeValidate: (card) => {
      if (!card.card_number) card.card_number = uuidv4()
    },
  },
})

const Receipts = sequelize.define('receipts', {
  receipt_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Users, key: 'user_id' },
  },
  bonus_card_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: BonusCards, key: 'card_id' },
  },
  total: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  bonus_used: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  bonus_added: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
})

const ReceiptItems = sequelize.define('receipt_items', {
  item_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  receipt_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Receipts, key: 'receipt_id' },
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Products, key: 'product_id' },
  },
  quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  price: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
})

const Messages = sequelize.define('messages', {
  message_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Users, key: 'user_id' },
  },
  receiver_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Users, key: 'user_id' },
  },
  content_type: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  content: { type: DataTypes.TEXT, allowNull: false },
})

const Notifications = sequelize.define('notifications', {
  notification_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Users, key: 'user_id' },
  },
  message: { type: DataTypes.STRING(255), allowNull: false },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
})

const Orders = sequelize.define('orders', {
  order_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Users, key: 'user_id' },
  },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'новый' },
  total: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  contact_phone: { type: DataTypes.STRING },
  contact_name: { type: DataTypes.STRING },
})

const OrderItems = sequelize.define('order_items', {
  order_item_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Orders, key: 'order_id' },
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Products, key: 'product_id' },
  },
  quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  price: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
})

CartItem.belongsTo(Users, { foreignKey: 'user_id', as: 'User' })
CartItem.belongsTo(Products, { foreignKey: 'product_id', as: 'Product' })
Users.hasMany(CartItem, { foreignKey: 'user_id', as: 'CartItems' })

Receipts.belongsTo(Users, { foreignKey: 'user_id', as: 'User' })
Receipts.belongsTo(BonusCards, { foreignKey: 'bonus_card_id', as: 'BonusCard' })
Receipts.hasMany(ReceiptItems, { foreignKey: 'receipt_id', as: 'ReceiptItems' })
ReceiptItems.belongsTo(Receipts, { foreignKey: 'receipt_id', as: 'Receipt' })
ReceiptItems.belongsTo(Products, { foreignKey: 'product_id', as: 'Product' })

Messages.belongsTo(Users, { foreignKey: 'sender_id', as: 'Sender' })
Messages.belongsTo(Users, { foreignKey: 'receiver_id', as: 'Receiver' })

Notifications.belongsTo(Users, { foreignKey: 'user_id', as: 'User' })
Users.hasMany(Notifications, { foreignKey: 'user_id', as: 'Notifications' })

BonusCards.belongsTo(Users, { foreignKey: 'user_id', as: 'User' })
Users.hasOne(BonusCards, { foreignKey: 'user_id', as: 'BonusCard' })

Orders.belongsTo(Users, { foreignKey: 'user_id', as: 'User' })
Users.hasMany(Orders, { foreignKey: 'user_id', as: 'Orders' })
Orders.hasMany(OrderItems, { foreignKey: 'order_id', as: 'OrderItems' })
OrderItems.belongsTo(Orders, { foreignKey: 'order_id', as: 'Order' })
OrderItems.belongsTo(Products, { foreignKey: 'product_id', as: 'Product' })

export {
  sequelize,
  Users,
  Products,
  CartItem,
  BonusCards,
  Receipts,
  ReceiptItems,
  Messages,
  Notifications,
  Orders,
  OrderItems,
}

import sequelize from './index.js'
import { Products, Users } from './models.js'

const demoProducts = [
  { name: 'Кофе зерновой', price: 5490 },
  { name: 'Чай чёрный', price: 1790 },
  { name: 'Шоколад', price: 990 },
  { name: 'Печенье', price: 1290 },
  { name: 'Вода 0,5 л', price: 450 },
]

const seed = async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync()

    await Users.findOrCreate({
      where: { email: 'demo.user@example.com' },
      defaults: {
        password: 'DemoUser123!',
        first_name: 'Демо',
        last_name: 'Пользователь',
        access_level: 1,
      },
    })

    await Users.findOrCreate({
      where: { email: 'demo.admin@example.com' },
      defaults: {
        password: 'DemoAdmin123!',
        first_name: 'Демо',
        last_name: 'Администратор',
        access_level: 2,
      },
    })

    for (const product of demoProducts) {
      await Products.findOrCreate({ where: { name: product.name }, defaults: product })
    }

    console.log('Demo data is ready.')
    console.log('User:  demo.user@example.com / DemoUser123!')
    console.log('Admin: demo.admin@example.com / DemoAdmin123!')
  } finally {
    await sequelize.close()
  }
}

seed().catch((error) => {
  console.error('Seeding failed:', error)
  process.exitCode = 1
})

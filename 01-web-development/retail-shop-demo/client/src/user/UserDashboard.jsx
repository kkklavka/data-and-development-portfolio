import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import API from '../API'
import { useUser } from '../context/UserContext'
import SupportChat from './SupportChat'

export default function UserDashboard () {
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [cart, setCart] = useState([])
  const [profileName, setProfileName] = useState('')
  const [phone, setPhone] = useState('')
  const [bonusCard, setBonusCard] = useState(null)
  const [creatingCard, setCreatingCard] = useState(false)
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  const navigate = useNavigate()
  const { logout } = useUser()

  const loadCart = async () => {
    try {
      const data = await API.getCart()
      setCart(data?.cart || [])
    } catch (error) {
      console.error('Cart loading error:', error)
      toast.error('Не удалось загрузить корзину')
    }
  }

  useEffect(() => {
    API.getProfile()
      .then((profile) => setProfileName(profile.name || ''))
      .catch(() => setProfileName(''))

    API.getBonusCard()
      .then((data) => {
        const card = data?.bonus_card || null
        setBonusCard(card)
        if (card?.phone) setPhone(card.phone)
      })
      .catch(() => setBonusCard(null))

    API.getAllProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Не удалось загрузить товары'))
      .finally(() => setLoadingProducts(false))

    loadCart()
  }, [])

  const total = useMemo(() => cart.reduce(
    (sum, item) => sum + (item.Product?.price || 0) * item.quantity,
    0
  ), [cart])

  const addToCart = async (productId) => {
    try {
      await API.addToCart({ product_id: productId, quantity: 1 })
      await loadCart()
    } catch (error) {
      console.error('Add-to-cart error:', error)
      toast.error('Не удалось добавить товар')
    }
  }

  const setQuantity = async (item, quantity) => {
    try {
      if (quantity <= 0) await API.removeFromCart(item.product_id)
      else await API.updateCartQuantity({ product_id: item.product_id, quantity })
      await loadCart()
    } catch (error) {
      console.error('Cart update error:', error)
      toast.error('Не удалось обновить корзину')
    }
  }

  const createBonusCard = async () => {
    if (!phone.trim()) {
      toast.error('Введите номер телефона')
      return
    }

    setCreatingCard(true)
    try {
      const data = await API.createBonusCard({ phone })
      setBonusCard(data.bonus_card)
      toast.success('Бонусная карта создана')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Не удалось создать бонусную карту')
    } finally {
      setCreatingCard(false)
    }
  }

  const submitOrder = async () => {
    if (!cart.length) {
      toast.warning('Корзина пуста')
      return
    }
    if (!phone.trim()) {
      toast.error('Введите номер телефона')
      return
    }
    if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
      toast.error('Заполните данные для демонстрационной оплаты')
      return
    }

    setSubmittingOrder(true)
    try {
      await API.createOrder({ phone })
      await loadCart()
      setCardNumber('')
      setCardExpiry('')
      setCardCvv('')
      toast.success('Заказ оформлен')
      navigate('/orders')
    } catch (error) {
      console.error('Order submission error:', error)
      toast.error(error.response?.data?.error || 'Не удалось оформить заказ')
    } finally {
      setSubmittingOrder(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  return (
    <Box p={3} maxWidth={1100} mx="auto">
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} mb={3}>
        <Box>
          <Typography variant="h4">Магазин</Typography>
          <Typography color="text.secondary">{profileName ? `Здравствуйте, ${profileName}` : 'Личный кабинет'}</Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" onClick={() => navigate('/orders')}>Мои заказы</Button>
          <Button variant="outlined" onClick={() => navigate('/history')}>Мои чеки</Button>
          <Button color="error" variant="outlined" onClick={handleLogout}>Выйти</Button>
        </Stack>
      </Stack>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6">Бонусная программа</Typography>
          {bonusCard ? (
            <Stack spacing={0.75} mt={1}>
              <Typography>Баланс: <b>{bonusCard.balance}</b> баллов</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Номер карты: <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>{bonusCard.card_number}</Box>
                </Typography>
                <Button
                  size="small"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(bonusCard.card_number)
                      toast.success('Номер карты скопирован')
                    } catch {
                      toast.error('Не удалось скопировать номер карты')
                    }
                  }}
                >
                  Копировать
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={2}>
              <TextField label="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} size="small" />
              <Button variant="outlined" onClick={createBonusCard} disabled={creatingCard}>
                {creatingCard ? <CircularProgress size={20} /> : 'Создать карту'}
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Typography variant="h5" mb={2}>Каталог товаров</Typography>
      {loadingProducts ? (
        <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>
      ) : (
        <Stack direction="row" gap={2} flexWrap="wrap" mb={4}>
          {products.map((product) => (
            <Card key={product.product_id} sx={{ width: 190 }}>
              <CardContent>
                <Typography variant="subtitle1">{product.name}</Typography>
                <Typography variant="h6" mt={1}>{product.price} ₸</Typography>
                <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => addToCart(product.product_id)}>
                  Добавить
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Divider sx={{ mb: 3 }} />
      <Typography variant="h5" mb={2}>Корзина</Typography>
      {!cart.length ? (
        <Typography color="text.secondary" mb={4}>Товары не добавлены</Typography>
      ) : (
        <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
          <List>
            {cart.map((item) => (
              <ListItem
                key={item.cart_item_id}
                secondaryAction={(
                  <IconButton edge="end" aria-label="Удалить" onClick={() => setQuantity(item, 0)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              >
                <ListItemText
                  primary={item.Product?.name || 'Товар'}
                  secondary={(
                    <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                      <Typography variant="body2">{item.Product?.price || 0} ₸</Typography>
                      <Button size="small" onClick={() => setQuantity(item, item.quantity - 1)}>−</Button>
                      <Typography variant="body2">{item.quantity}</Typography>
                      <Button size="small" onClick={() => setQuantity(item, item.quantity + 1)}>+</Button>
                    </Stack>
                  )}
                />
              </ListItem>
            ))}
          </List>
          <Typography variant="h6" textAlign="right">Итого: {total} ₸</Typography>
        </Paper>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6">Оформление заказа</Typography>
          <Typography variant="body2" color="text.secondary" mt={1} mb={2}>
            Демонстрационная оплата: данные карты проверяются только в интерфейсе и не отправляются на сервер.
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <TextField
              label="Номер карты"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '))}
              inputProps={{ maxLength: 19 }}
            />
            <TextField
              label="MM/YY"
              value={cardExpiry}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
                setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits)
              }}
              sx={{ maxWidth: 120 }}
            />
            <TextField
              label="CVV"
              type="password"
              value={cardCvv}
              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
              sx={{ maxWidth: 100 }}
            />
          </Stack>
          <Button variant="contained" sx={{ mt: 2 }} onClick={submitOrder} disabled={submittingOrder || !cart.length}>
            {submittingOrder ? <CircularProgress size={22} /> : 'Оформить заказ'}
          </Button>
        </CardContent>
      </Card>

      <SupportChat />
    </Box>
  )
}

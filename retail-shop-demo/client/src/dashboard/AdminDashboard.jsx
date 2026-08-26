import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  Stack,
} from '@mui/material'
import { Html5QrcodeScanner } from 'html5-qrcode'
import API from '../API'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import SupportChat from '../user/SupportChat'

function TabPanel ({ children, value, index }) {
  return value === index ? <Box sx={{ p: 3 }}>{children}</Box> : null
}

const scannerTranslations = new Map([
  ['Request Camera Permissions', 'Разрешить доступ к камере'],
  ['Scan an Image File', 'Загрузить изображение'],
  ['Scan using camera directly', 'Сканировать камерой'],
  ['Start Scanning', 'Начать сканирование'],
  ['Stop Scanning', 'Остановить сканирование'],
  ['Choose Image', 'Выбрать изображение'],
])

function localizeScanner (root) {
  if (!root) return
  root.querySelectorAll('button, a, span').forEach((element) => {
    const text = element.textContent?.trim()
    if (scannerTranslations.has(text)) element.textContent = scannerTranslations.get(text)
  })
}

export default function AdminCashierDashboard () {
  const [tabIndex, setTabIndex] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)
  const [stats, setStats] = useState({ receiptCount: 0, productCount: 0 })
  const [errorStats, setErrorStats] = useState('')
  const [scannerReady, setScannerReady] = useState(true)
  const [cart, setCart] = useState([])
  const [cardNumber, setCardNumber] = useState('')
  const [cardData, setCardData] = useState(null)
  const [loadingPay, setLoadingPay] = useState(false)
  const [loadingReceipts, setLoadingReceipts] = useState(false)
  const [receipts, setReceipts] = useState([])
  const [errorReceipts, setErrorReceipts] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [products, setProducts] = useState([])
  const [errorProducts, setErrorProducts] = useState('')

  const navigate = useNavigate()
  const { logout } = useUser()

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  useEffect(() => {
    if (tabIndex !== 0) return
    setLoadingStats(true)

    const fetchStats = async () => {
      try {
        const receipts = await API.request('/admin/receipts')
        const products = await API.getAllProducts()
        setStats({
          receiptCount: receipts?.length || 0,
          productCount: products?.length || 0,
        })
        setErrorStats('')
      } catch (err) {
        console.error('Ошибка при получении статистики:', err)
        setErrorStats('Не удалось загрузить данные. Попробуйте позже.')
      } finally {
        setLoadingStats(false)
      }
    }
    fetchStats()
  }, [tabIndex])

  useEffect(() => {
    if (tabIndex !== 2) return
    setLoadingReceipts(true)
    API.request('/admin/receipts')
      .then((data) => {
        setReceipts(data)
        setErrorReceipts('')
      })
      .catch((err) => {
        console.error('Ошибка получения чеков:', err)
        setErrorReceipts('Не удалось загрузить историю чеков.')
      })
      .finally(() => setLoadingReceipts(false))
  }, [tabIndex])

  useEffect(() => {
    if (tabIndex !== 3) return
    setLoadingProducts(true)
    API.getAllProducts()
      .then((data) => {
        setProducts(data)
        setErrorProducts('')
      })
      .catch((err) => {
        console.error('Ошибка получения товаров:', err)
        setErrorProducts('Не удалось загрузить каталог товаров.')
      })
      .finally(() => setLoadingProducts(false))
  }, [tabIndex])

  useEffect(() => {
    if (tabIndex !== 1) return

    const loadCart = async () => {
      try {
        const updatedCart = await API.getCart()
        setCart(updatedCart.cart)
      } catch (err) {
        console.error('Ошибка при загрузке корзины:', err)
      }
    }

    setScannerReady(true)
    loadCart()
  }, [tabIndex])

  useEffect(() => {
    if (tabIndex !== 1) return
    let scanner
    if (scannerReady) {
      scanner = new Html5QrcodeScanner(
        'scanner',
        { fps: 10, qrbox: 250 },
        false
      )

      scanner.render(
        async (decodedText) => {
          scanner.clear()
          setScannerReady(false)

          try {
            await API.addToCart({ product_id: decodedText })
            const updatedCart = await API.getCart()
            setCart(updatedCart.cart || [])
          } catch (err) {
            console.error('Ошибка при добавлении товара в корзину:', err)
          }

          setTimeout(() => setScannerReady(true), 500)
        }
      )

      const scannerRoot = document.getElementById('scanner')
      localizeScanner(scannerRoot)
      const observer = scannerRoot ? new MutationObserver(() => localizeScanner(scannerRoot)) : null
      observer?.observe(scannerRoot, { childList: true, subtree: true, characterData: true })

      return () => {
        observer?.disconnect()
        scanner?.clear().catch(() => {})
      }
    }

    return undefined
  }, [scannerReady, tabIndex])

  const total = cart?.reduce((sum, item) => {
    const price = item.Product?.price || 0
    return sum + price * (item.quantity || 1)
  }, 0)

  const [cardError, setCardError] = useState('')

  const handlePay = async () => {
    if (cart.length === 0) return
    setLoadingPay(true)
    setCardError('')

    try {
      const res = await API.pay({
        bonus_card_number: cardNumber,
        use_bonus: 0
      })

      if (res?.receipt?.receipt_id) {
        setCart([])
        setCardData(null)
        setCardNumber('')
        navigate(`/receipt/${res.receipt.receipt_id}`)
      } else {
        setCardError('Произошла ошибка при оплате. Попробуйте ещё раз.')
      }
    } catch (err) {
      console.error('Ошибка при оплате:', err)
      if (err?.response?.status === 404) {
        setCardError('Бонусная карта не найдена. Проверьте номер.')
      } else {
        setCardError('Ошибка сервера. Попробуйте позже.')
      }
    } finally {
      setLoadingPay(false)
    }
  }

  const handleCheckCard = async () => {
    try {
      const result = await API.getBonusCardByNumber(cardNumber)
      if (result?.bonus_card) {
        setCardData(result.bonus_card)
        setCardError('')
      } else {
        setCardData(null)
        setCardError('Бонусная карта не найдена.')
      }
    } catch (err) {
      console.error('Ошибка при проверке карты:', err)
      setCardData(null)
      setCardError('Произошла ошибка при проверке карты.')
    }
  }

  const handleChangeQuantity = async (productId, newQuantity) => {
    try {
      const result = await API.updateCartQuantity({
        product_id: productId,
        quantity: newQuantity
      })
      if (result?.cart) {
        setCart(result.cart)
      }
    } catch (err) {
      console.error('Ошибка при обновлении количества:', err)
    }
  }

  const removeItem = async (productId) => {
    try {
      await API.removeFromCart(productId)
      const updatedCart = await API.getCart()
      setCart(updatedCart.cart || [])
    } catch (err) {
      console.error('Ошибка при удалении товара:', err)
    }
  }

  return (
    <Box p={3} maxWidth={1000} mx="auto">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">Панель администратора / кассира</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/admin/orders')}>Заказы</Button>
          <Button
          onClick={handleLogout}
          sx={{
            backgroundColor: '#e53935',
            color: 'white',
            borderRadius: '8px',
            padding: '6px 16px',
            fontSize: '14px',
            '&:hover': { backgroundColor: '#c62828' },
          }}
        >
          Выйти
          </Button>
        </Stack>
      </Box>

      <Tabs
        value={tabIndex}
        onChange={(e, newVal) => setTabIndex(newVal)}
        aria-label="dashboard tabs"
        sx={{ mb: 3 }}
      >
        <Tab label="Статистика" />
        <Tab label="Касса" />
        <Tab label="История чеков" />
        <Tab label="Каталог товаров" />
      </Tabs>

      <TabPanel value={tabIndex} index={0}>
        {loadingStats
          ? (
          <Stack alignItems="center">
            <CircularProgress />
          </Stack>
            )
          : errorStats
            ? (
          <Typography color="error">{errorStats}</Typography>
              )
            : (
          <Stack spacing={2} direction="row" justifyContent="space-around">
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6">Всего чеков</Typography>
                <Typography variant="h4">{stats.receiptCount}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6">Товаров в каталоге</Typography>
                <Typography variant="h4">{stats.productCount}</Typography>
              </CardContent>
            </Card>
          </Stack>
              )}
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                    <Typography variant="h6">Сканирование товара</Typography>
<div id="scanner" style={{ width: '100%' }}></div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Корзина</Typography>
                {cart.length === 0
                  ? (
                  <Typography color="text.secondary">
                    Товары не добавлены
                  </Typography>
                    )
                  : (
                 <List dense>
  {cart?.map((item) => (
    <React.Fragment key={item.product_id}>
      <ListItem
        secondaryAction={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleChangeQuantity(item.product_id, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              −
            </Button>
            <Typography>{item.quantity}</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleChangeQuantity(item.product_id, item.quantity + 1)}
            >
              +
            </Button>
            <Button
              color="error"
              size="small"
              onClick={() => removeItem(item.product_id)}
            >
              Удалить
            </Button>
          </Stack>
        }
      >
        <ListItemText
          primary={item.Product?.name || item.name}
          secondary={`${item.Product?.price || item.price} ₸ × ${item.quantity}`}
        />
      </ListItem>
      <Divider />
    </React.Fragment>
  ))}
</List>

                    )}
                <Typography mt={2}>
                  <b>Итого: {total} ₸</b>
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
           <TextField
  label="Номер карты"
  value={cardNumber}
  onChange={(e) => {
    setCardNumber(e.target.value)
    setCardError('')
  }}
  fullWidth
  variant="outlined"
  size="small"
  margin="normal"
  error={!!cardError}
  helperText={cardError}
/>
<Button variant="outlined" onClick={handleCheckCard} sx={{ mt: 1 }}>
  Проверить
</Button>

{cardData && (
  <Box mt={2}>
    <Typography variant="body2" color="text.secondary">
      Владелец: {[cardData.User?.first_name, cardData.User?.last_name].filter(Boolean).join(' ') || 'не указан'}
    </Typography>
    <Typography>Баланс: <b>{cardData.balance}</b> баллов</Typography>
  </Box>
)}

          </Grid>

          <Grid item xs={12} md={6}>
           <Card>
  <CardContent>
    <Typography variant="h6">Оплата</Typography>

    {cardError && (
      <Typography color="error" mt={1}>
        {cardError}
      </Typography>
    )}

    <Button
      variant="contained"
      color="primary"
      fullWidth
      disabled={loadingPay || cart.length === 0}
      onClick={handlePay}
    >
      {loadingPay ? <CircularProgress size={24} /> : 'Оплатить'}
    </Button>
  </CardContent>
</Card>

          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabIndex} index={2}>
        {loadingReceipts
          ? (
          <Stack alignItems="center">
            <CircularProgress />
          </Stack>
            )
          : errorReceipts
            ? (
          <Typography color="error">{errorReceipts}</Typography>
              )
            : receipts.length === 0
              ? (
          <Typography>Чеки отсутствуют</Typography>
                )
              : (
          <List>
            {receipts?.map((r) => (
              <ListItem
                key={r.receipt_id}
                button
                onClick={() => navigate(`/receipt/${r.receipt_id}`)}
              >
                <ListItemText
                  primary={`Чек #${r.receipt_id} — Итого: ${r.total} ₸`}
                  secondary={new Date(r.createdAt).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
                )}
      </TabPanel>

      <TabPanel value={tabIndex} index={3}>
        {loadingProducts
          ? (
          <Stack alignItems="center">
            <CircularProgress />
          </Stack>
            )
          : errorProducts
            ? (
          <Typography color="error">{errorProducts}</Typography>
              )
            : products.length === 0
              ? (
          <Typography>Товары отсутствуют</Typography>
                )
              : (
          <List>
            {products?.map((p) => (
              <ListItem key={p.product_id}>
                <ListItemText primary={p.name} secondary={`${p.price} ₸`} />
              </ListItem>
            ))}
          </List>
                )}
      </TabPanel>

      <SupportChat />
    </Box>
  )
}

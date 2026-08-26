import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import API from '../API'

const statuses = ['новый', 'собирается', 'собран', 'выдан', 'отменён']

export default function AdminOrders () {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const loadOrders = async () => {
    try {
      const data = await API.getAdminOrders()
      setOrders(data?.orders || [])
      setError('')
    } catch (requestError) {
      console.error('Order loading error:', requestError)
      setError('Не удалось загрузить заказы')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [])

  const updateStatus = async (orderId, status) => {
    try {
      await API.updateOrderStatus(orderId, status)
      await loadOrders()
    } catch (requestError) {
      console.error('Order status update error:', requestError)
      setError('Не удалось обновить статус заказа')
    }
  }

  return (
    <Box p={3} maxWidth={1000} mx="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Заказы</Typography>
        <Button variant="outlined" onClick={() => navigate('/admin')}>Назад</Button>
      </Stack>

      {loading && <Box textAlign="center"><CircularProgress /></Box>}
      {error && <Typography color="error" mb={2}>{error}</Typography>}
      {!loading && !orders.length && <Typography color="text.secondary">Заказов пока нет</Typography>}

      <Stack spacing={2}>
        {orders.map((order) => (
          <Card key={order.order_id}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography variant="h6">Заказ #{order.order_id}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.User?.first_name} {order.User?.last_name} · {order.User?.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(order.createdAt).toLocaleString('ru-RU')}
                  </Typography>
                </Box>
                <Select
                  size="small"
                  value={order.status}
                  onChange={(e) => updateStatus(order.order_id, e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  {statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                </Select>
              </Stack>
              <Divider sx={{ my: 2 }} />
              {(order.OrderItems || []).map((item) => (
                <Typography key={item.order_item_id} variant="body2">
                  {item.Product?.name || `Товар #${item.product_id}`}: {item.quantity} × {item.price} ₸
                </Typography>
              ))}
              <Typography variant="h6" textAlign="right" mt={2}>Итого: {order.total} ₸</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}

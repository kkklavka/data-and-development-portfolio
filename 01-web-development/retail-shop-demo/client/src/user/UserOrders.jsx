import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import API from '../API'

export default function UserOrders () {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    API.getUserOrders()
      .then((data) => setOrders(data?.orders || []))
      .catch(() => setError('Не удалось загрузить заказы'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Box p={3} maxWidth={900} mx="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Мои заказы</Typography>
        <Button variant="outlined" onClick={() => navigate('/user')}>Назад в магазин</Button>
      </Stack>

      {loading && <Box textAlign="center"><CircularProgress /></Box>}
      {error && <Typography color="error">{error}</Typography>}
      {!loading && !error && !orders.length && <Typography color="text.secondary">Заказов пока нет</Typography>}

      <Stack spacing={2}>
        {orders.map((order) => (
          <Card key={order.order_id}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                <Typography variant="h6">Заказ #{order.order_id}</Typography>
                <Typography>Статус: <b>{order.status}</b></Typography>
              </Stack>
              <Typography color="text.secondary" variant="body2" mt={1}>
                {new Date(order.createdAt).toLocaleString('ru-RU')}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <List dense disablePadding>
                {(order.OrderItems || []).map((item) => (
                  <ListItem key={item.order_item_id} disableGutters>
                    <ListItemText
                      primary={item.Product?.name || `Товар #${item.product_id}`}
                      secondary={`${item.quantity} × ${item.price} ₸`}
                    />
                  </ListItem>
                ))}
              </List>
              <Typography variant="h6" textAlign="right">Итого: {order.total} ₸</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}

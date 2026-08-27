import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import API from '../API'

const History = () => {
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    API.getMyReceipts()
      .then(setReceipts)
      .catch(() => setError('Не удалось загрузить историю чеков'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Box p={3} maxWidth={800} mx="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">История чеков</Typography>
        <Button variant="outlined" onClick={() => navigate('/user')}>Назад</Button>
      </Stack>
      {loading && <Box textAlign="center"><CircularProgress /></Box>}
      {error && <Typography color="error">{error}</Typography>}
      {!loading && !error && !receipts.length && <Typography color="text.secondary">Чеки не найдены</Typography>}
      <Stack spacing={2}>
        {receipts.map((receipt) => (
          <Card key={receipt.receipt_id} onClick={() => navigate(`/receipt/${receipt.receipt_id}`)} sx={{ cursor: 'pointer' }}>
            <CardContent>
              <Typography variant="h6">Чек #{receipt.receipt_id}</Typography>
              <Typography>{receipt.total} ₸</Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(receipt.createdAt).toLocaleString('ru-RU')}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}

export default History

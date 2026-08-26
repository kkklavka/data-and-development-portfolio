import { useParams } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import API from '../API'
import { CircularProgress, Paper, Typography, Divider, Box, Button } from '@mui/material'
import QRCode from 'react-qr-code'

function ReceiptView () {
  const { id } = useParams()
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef()

  useEffect(() => {
    API.getReceiptById(id)
      .then((res) => {
        setReceipt(res)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML
    const originalContents = document.body.innerHTML
    document.body.innerHTML = printContents
    window.print()
    document.body.innerHTML = originalContents
    window.location.reload()
  }

  if (loading) {
    return (
      <Box textAlign="center" mt={10}>
        <CircularProgress />
        <Typography mt={2}>Загрузка чека...</Typography>
      </Box>
    )
  }

  if (!receipt) {
    return (
      <Typography textAlign="center" mt={10}>
        Чек не найден
      </Typography>
    )
  }

  const purchaseDate = new Date(receipt.createdAt).toLocaleString()

  const qrData = JSON.stringify({
    id: receipt.receipt_id,
    total: receipt.total,
    date: purchaseDate,
    items: receipt.ReceiptItems?.map(item => ({
      name: item.Product?.name,
      quantity: item.quantity,
      price: item.price
    }))
  })

  return (
    <>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 6 }} ref={printRef}>
        <Typography variant="h5" align="center" gutterBottom>
          Онлайн-чек
        </Typography>
        <Typography variant="subtitle2" align="center" gutterBottom>
          Чек №{receipt.receipt_id}
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          Дата покупки: {purchaseDate}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {receipt.ReceiptItems?.map((item, index) => (
          <Box key={index} display="flex" justifyContent="space-between" mb={1}>
            <Typography>{item.Product?.name || '—'}</Typography>
            <Typography>
              {item.quantity} × {item.price} ₸ = {item.quantity * item.price} ₸
            </Typography>
          </Box>
        ))}

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" fontWeight="bold">
          <Typography>Итого:</Typography>
          <Typography>{receipt.total} ₸</Typography>
        </Box>

        {receipt.bonus_used != null && (
          <Typography variant="body2" color="text.secondary" mt={2}>
            Использовано бонусов: {receipt.bonus_used} баллов
          </Typography>
        )}

        {receipt.bonus_added != null && (
          <Typography variant="body2" color="text.secondary">
            Начислено бонусов: {receipt.bonus_added} баллов
          </Typography>
        )}

        <Box mt={4} textAlign="center">
          <Typography variant="body2" mb={1}>QR-код чека:</Typography>
          <QRCode value={qrData} size={140} />
        </Box>
      </Paper>

      <Box textAlign="center" mt={2}>
        <Button variant="contained" color="primary" onClick={handlePrint}>
          Печать чека
        </Button>
      </Box>
    </>
  )
}

export default ReceiptView

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import { io } from 'socket.io-client'

import API from '../API'
import { useUser } from '../context/UserContext'

const SupportChat = () => {
  const { user } = useUser()
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const isStaff = user?.access_level >= 2

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return undefined

    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3500', {
      path: '/ws',
      auth: { token },
    })
    socketRef.current = socket

    socket.on('newMessage', (message) => {
      setMessages((current) => current.some((item) => item.message_id === message.message_id)
        ? current
        : [...current, message])
    })

    return () => socket.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError('')

    Promise.all([
      API.getMessages(),
      isStaff ? API.getAllUsers() : Promise.resolve([]),
    ])
      .then(([messageData, userData]) => {
        setMessages(Array.isArray(messageData) ? messageData : [])
        if (isStaff) {
          const customers = (userData || []).filter((item) => item.access_level === 1)
          setUsers(customers)
          if (!selectedUserId && customers.length) setSelectedUserId(customers[0].user_id)
        }
      })
      .catch(() => setError('Не удалось загрузить чат'))
      .finally(() => setLoading(false))
  }, [open, isStaff])

  const visibleMessages = useMemo(() => {
    if (!isStaff || !selectedUserId) return messages
    const id = Number(selectedUserId)
    return messages.filter((message) => message.sender_id === id || message.receiver_id === id)
  }, [messages, isStaff, selectedUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleMessages])

  const handleSend = async () => {
    const content = newMessage.trim()
    if (!content) return
    if (isStaff && !selectedUserId) {
      setError('Выберите пользователя')
      return
    }

    try {
      const payload = { content, content_type: 0 }
      if (isStaff) payload.receiver_id = Number(selectedUserId)
      const saved = await API.sendMessage(payload)
      setMessages((current) => current.some((item) => item.message_id === saved.message_id)
        ? current
        : [...current, saved])
      setNewMessage('')
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Не удалось отправить сообщение')
    }
  }

  return (
    <>
      <IconButton
        aria-label="Открыть чат"
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1300 }}
        color="primary"
      >
        <ChatIcon />
      </IconButton>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 380, maxWidth: '100vw', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{isStaff ? 'Поддержка пользователей' : 'Чат с поддержкой'}</Typography>
            <IconButton onClick={() => setOpen(false)}><CloseIcon /></IconButton>
          </Box>

          {isStaff && (
            <Box sx={{ p: 2, pb: 0 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Пользователь</InputLabel>
                <Select
                  value={selectedUserId}
                  label="Пользователь"
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  {users.map((item) => (
                    <MenuItem key={item.user_id} value={item.user_id}>
                      {`${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
            ) : (
              <List>
                {visibleMessages.map((message) => (
                  <ListItem key={message.message_id} alignItems="flex-start">
                    <ListItemText
                      primary={message.sender_id === user.user_id ? 'Вы' : (message.Sender?.first_name || 'Собеседник')}
                      secondary={message.content}
                    />
                  </ListItem>
                ))}
                <div ref={messagesEndRef} />
              </List>
            )}
          </Box>

          <Divider />
          <Box sx={{ p: 2 }}>
            {error && <Typography color="error" variant="body2" mb={1}>{error}</Typography>}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Введите сообщение"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                size="small"
              />
              <Button onClick={handleSend} variant="contained">Отправить</Button>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default SupportChat

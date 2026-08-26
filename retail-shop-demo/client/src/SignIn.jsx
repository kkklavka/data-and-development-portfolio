import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  TextField,
  Button,
  Paper,
  Stack,
  Typography,
  Link,
} from '@mui/material'
import API from './API'
import { useUser } from './context/UserContext'

export default function SignIn () {
  const navigate = useNavigate()
  const { login } = useUser()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    const { email, password } = form
    if (!email || !password) {
      setError('Введите email и пароль')
      return
    }

    try {
      const result = await API.login({ email, password })

      if (result?.token && result?.user?.access_level) {
        login(result.user, result.token)

        if (result.user.access_level >= 2) {
          navigate('/admin')
        } else {
          navigate('/user')
        }
      } else {
        setError('Ошибка входа. Проверьте email и пароль.')
      }
    } catch (e) {
      console.error('Login error:', e)
      setError('Ошибка входа. Проверьте email и пароль.')
    }
  }

  return (
    <Stack alignItems="center" justifyContent="center" minHeight="100vh">
      <Paper sx={{ p: 4, width: 'calc(100vw - 32px)', maxWidth: 400 }}>
        <Typography variant="h4" gutterBottom>Вход</Typography>

        <TextField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Пароль"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        <Button fullWidth variant="contained" sx={{ mt: 3 }} onClick={handleSubmit}>
          Войти
        </Button>

        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Нет аккаунта?{' '}
          <Link component={RouterLink} to="/signup">
            Зарегистрироваться
          </Link>
        </Typography>
      </Paper>
    </Stack>
  )
}

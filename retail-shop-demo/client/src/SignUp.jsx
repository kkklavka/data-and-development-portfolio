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

export default function SignUp () {
  const navigate = useNavigate()
  const { login } = useUser()
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    const { email, password, first_name, last_name } = form
    if (!email || !password || !first_name || !last_name) {
      setError('Пожалуйста, заполните все поля')
      return
    }
    setError('')
    try {
      const result = await API.register({ email, password, first_name, last_name })

      if (result?.token && result?.user?.access_level) {
        login(result.user, result.token)

        if (result.user.access_level >= 2) {
          navigate('/admin')
        } else {
          navigate('/user')
        }
      } else {
        setError('Не удалось завершить регистрацию.')
      }
    } catch (e) {
      console.error('Registration error:', e)
      setError('Ошибка при регистрации. Попробуйте снова.')
    }
  }

  return (
    <Stack alignItems="center" justifyContent="center" minHeight="100vh">
      <Paper sx={{ p: 4, width: 'calc(100vw - 32px)', maxWidth: 400 }}>
        <Typography variant="h4" gutterBottom>Регистрация</Typography>

        <TextField
          label="Фамилия"
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Имя"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Email"
          name="email"
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
          Зарегистрироваться
        </Button>

        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Уже есть аккаунт?{' '}
          <Link component={RouterLink} to="/signin">
            Войти
          </Link>
        </Typography>
      </Paper>
    </Stack>
  )
}

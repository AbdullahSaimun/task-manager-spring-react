import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Link from '@mui/material/Link'
import { useAuth } from '../contexts/AuthContext'
import { getErrorMessage } from '../api/client'

const loginSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
})

type LoginFormValues = yup.InferType<typeof loginSchema>

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null)
    try {
      await login(values.username, values.password)
      navigate('/')
    } catch (err: unknown) {
      setSubmitError(getErrorMessage(err, 'Login failed. Please try again.'))
    }
  }

  return (
    <Stack sx={{ maxWidth: 360, mx: 'auto', mt: 8 }} spacing={2}>
      <Typography variant="h4">Log In</Typography>
      {submitError && <Alert severity="error">{submitError}</Alert>}
      <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Username"
          {...register('username')}
          error={!!errors.username}
          helperText={errors.username?.message}
        />
        <TextField
          label="Password"
          type="password"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
        />
        <Button type="submit" variant="contained">
          Log In
        </Button>
      </Stack>
      <Typography variant="body2">
        Don't have an account? <Link component={RouterLink} to="/register">Register</Link>
      </Typography>
    </Stack>
  )
}

export default LoginPage

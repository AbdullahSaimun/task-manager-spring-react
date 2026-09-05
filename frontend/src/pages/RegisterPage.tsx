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

const registerSchema = yup.object({
  username: yup
    .string()
    .trim()
    .required('Username is required')
    .max(50, 'Username must be 50 characters or fewer'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
})

type RegisterFormValues = yup.InferType<typeof registerSchema>

function RegisterPage() {
  const { register: registerAccount } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: yupResolver(registerSchema),
    defaultValues: { username: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(values: RegisterFormValues) {
    setSubmitError(null)
    try {
      await registerAccount(values.username, values.password)
      navigate('/')
    } catch (err: unknown) {
      setSubmitError(getErrorMessage(err, 'Registration failed. Please try again.'))
    }
  }

  return (
    <Stack sx={{ maxWidth: 360, mx: 'auto', mt: 8 }} spacing={2}>
      <Typography variant="h4">Register</Typography>
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
        <TextField
          label="Confirm password"
          type="password"
          {...register('confirmPassword')}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
        />
        <Button type="submit" variant="contained">
          Register
        </Button>
      </Stack>
      <Typography variant="body2">
        Already have an account? <Link component={RouterLink} to="/login">Log in</Link>
      </Typography>
    </Stack>
  )
}

export default RegisterPage

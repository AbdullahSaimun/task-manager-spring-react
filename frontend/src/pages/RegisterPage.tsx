import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import AuthLayout from '../components/AuthLayout'
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
  const [showPassword, setShowPassword] = useState(false)

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

  const passwordToggleAdornment = (
    <InputAdornment position="end">
      <IconButton
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        onClick={() => setShowPassword((value) => !value)}
        edge="end"
        size="small"
      >
        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  )

  return (
    <AuthLayout
      title="Register"
      error={submitError}
      onSubmit={handleSubmit(onSubmit)}
      footer={
        <>
          Already have an account? <Link component={RouterLink} to="/login">Log in</Link>
        </>
      }
    >
      <TextField
        label="Username"
        {...register('username')}
        error={!!errors.username}
        helperText={errors.username?.message}
      />
      <TextField
        label="Password"
        type={showPassword ? 'text' : 'password'}
        {...register('password')}
        error={!!errors.password}
        helperText={errors.password?.message}
        slotProps={{ input: { endAdornment: passwordToggleAdornment } }}
      />
      <TextField
        label="Confirm password"
        type={showPassword ? 'text' : 'password'}
        {...register('confirmPassword')}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword?.message}
        slotProps={{ input: { endAdornment: passwordToggleAdornment } }}
      />
      <Button type="submit" variant="contained">
        Register
      </Button>
    </AuthLayout>
  )
}

export default RegisterPage

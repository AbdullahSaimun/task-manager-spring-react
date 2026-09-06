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

const loginSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
})

type LoginFormValues = yup.InferType<typeof loginSchema>

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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
    <AuthLayout
      title="Log In"
      error={submitError}
      onSubmit={handleSubmit(onSubmit)}
      footer={
        <>
          Don't have an account? <Link component={RouterLink} to="/register">Register</Link>
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
        slotProps={{
          input: {
            endAdornment: (
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
            ),
          },
        }}
      />
      <Button type="submit" variant="contained">
        Log In
      </Button>
    </AuthLayout>
  )
}

export default LoginPage

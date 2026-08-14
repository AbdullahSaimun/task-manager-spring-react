import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import type { TaskStatus, TaskPriority } from '../types/task'

const STATUS_OPTIONS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']
const PRIORITY_OPTIONS: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH']

const taskFormSchema = yup.object({
  title: yup.string().trim().required('Title is required'),
  description: yup.string().default(''),
  status: yup
    .string<TaskStatus>()
    .oneOf(STATUS_OPTIONS, 'Status is required')
    .required('Status is required'),
  priority: yup
    .string<TaskPriority>()
    .oneOf(PRIORITY_OPTIONS, 'Priority is required')
    .required('Priority is required'),
  dueDate: yup.string().default(''),
})

export type TaskFormValues = yup.InferType<typeof taskFormSchema>

interface TaskFormProps {
  defaultValues?: Partial<TaskFormValues>
  onSubmit: (values: TaskFormValues) => void
}

function TaskForm({ defaultValues, onSubmit }: TaskFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: yupResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: '',
      ...defaultValues,
    },
  })

  return (
    <Stack component="form" spacing={2} sx={{ maxWidth: 480 }} onSubmit={handleSubmit(onSubmit)}>
      <TextField
        label="Title"
        {...register('title')}
        error={!!errors.title}
        helperText={errors.title?.message}
      />
      <TextField label="Description" multiline minRows={3} {...register('description')} />
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            select
            label="Status"
            error={!!errors.status}
            helperText={errors.status?.message}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        name="priority"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            select
            label="Priority"
            error={!!errors.priority}
            helperText={errors.priority?.message}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <TextField
        label="Due date"
        type="date"
        slotProps={{ inputLabel: { shrink: true } }}
        {...register('dueDate')}
      />
      <Button type="submit" variant="contained">
        Save
      </Button>
    </Stack>
  )
}

export default TaskForm

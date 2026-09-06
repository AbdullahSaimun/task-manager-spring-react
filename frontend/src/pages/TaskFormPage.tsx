import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import PageHeader from '../components/PageHeader'
import LoadingState from '../components/LoadingState'
import TaskForm from '../components/TaskForm'
import type { TaskFormValues } from '../components/TaskForm'
import { createTask, getTask, updateTask } from '../api/tasks'
import { getErrorMessage } from '../api/client'
import type { Task } from '../types/task'

function TaskFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [existingTask, setExistingTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    getTask(Number(id))
      .then((task) => {
        if (!cancelled) setExistingTask(task)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Task not found.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleSubmit(values: TaskFormValues) {
    setSubmitError(null)
    const body = {
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority,
      dueDate: values.dueDate || null,
    }
    try {
      if (existingTask) {
        await updateTask(existingTask.id, body)
      } else {
        await createTask(body)
      }
      navigate('/')
    } catch (err: unknown) {
      setSubmitError(getErrorMessage(err, 'Failed to save task. Please try again.'))
    }
  }

  if (loading) {
    return <LoadingState label="Loading task…" />
  }

  if (loadError) {
    return <Alert severity="error">{loadError}</Alert>
  }

  return (
    <>
      <PageHeader title={existingTask ? `Edit Task ${existingTask.id}` : 'New Task'} />
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}
      <TaskForm
        defaultValues={
          existingTask
            ? {
                title: existingTask.title,
                description: existingTask.description ?? '',
                status: existingTask.status,
                priority: existingTask.priority,
                dueDate: existingTask.dueDate ?? '',
              }
            : undefined
        }
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default TaskFormPage

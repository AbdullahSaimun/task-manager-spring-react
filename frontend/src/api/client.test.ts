import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './client'

describe('getErrorMessage', () => {
  it('returns the backend message when the error carries the ErrorResponse shape', () => {
    const axiosLikeError = {
      isAxiosError: true,
      response: { data: { message: 'Task not found with id 26' } },
    }

    expect(getErrorMessage(axiosLikeError, 'fallback')).toBe('Task not found with id 26')
  })

  it('returns the fallback for a network error with no response', () => {
    const axiosLikeError = { isAxiosError: true, response: undefined }

    expect(getErrorMessage(axiosLikeError, 'fallback')).toBe('fallback')
  })

  it('returns the fallback for a non-axios error', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('fallback')
  })

  it('returns the fallback when the backend response has no message field', () => {
    const axiosLikeError = { isAxiosError: true, response: { data: {} } }

    expect(getErrorMessage(axiosLikeError, 'fallback')).toBe('fallback')
  })
})

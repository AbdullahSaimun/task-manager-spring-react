export interface ApiFieldError {
  field: string
  message: string
}

// Mirrors backend ErrorResponse (common/exception/ErrorResponse.java, section 13).
export interface ApiErrorResponse {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  fieldErrors?: ApiFieldError[]
}

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Project name validation
 */
export function validateProjectName(name: string): boolean {
  return name.trim().length > 0 && name.length <= 255
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`
}

/**
 * Get status color for UI
 */
export function getStatusColor(
  status: string
): 'success' | 'primary' | 'warning' | 'destructive' | 'muted' {
  switch (status) {
    case 'completed':
      return 'success'
    case 'processing':
      return 'primary'
    case 'pending':
      return 'warning'
    case 'failed':
      return 'destructive'
    default:
      return 'muted'
  }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

/**
 * Check if job is in progress
 */
export function isJobInProgress(status: string): boolean {
  return status === 'pending' || status === 'processing'
}

/**
 * Check if job is completed
 */
export function isJobCompleted(status: string): boolean {
  return status === 'completed'
}

/**
 * Check if job has failed
 */
export function isJobFailed(status: string): boolean {
  return status === 'failed'
}

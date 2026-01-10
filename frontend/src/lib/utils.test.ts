import { describe, it, expect, beforeEach } from 'vitest'
import { 
  validateEmail, 
  validateProjectName, 
  formatFileSize,
  getStatusColor,
  getStatusLabel,
} from './validation'

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('first+last@test.org')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('test@.com')).toBe(false)
    })
  })

  describe('validateProjectName', () => {
    it('should validate correct project names', () => {
      expect(validateProjectName('My Project')).toBe(true)
      expect(validateProjectName('Test123')).toBe(true)
      expect(validateProjectName('A')).toBe(true)
    })

    it('should reject invalid project names', () => {
      expect(validateProjectName('')).toBe(false)
      expect(validateProjectName('   ')).toBe(false)
      expect(validateProjectName('a'.repeat(256))).toBe(false)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(500)).toBe('500.0 B')
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1048576)).toBe('1.0 MB')
      expect(formatFileSize(1073741824)).toBe('1.0 GB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })
  })

  describe('getStatusColor', () => {
    it('should return correct colors for each status', () => {
      expect(getStatusColor('completed')).toBe('success')
      expect(getStatusColor('processing')).toBe('primary')
      expect(getStatusColor('pending')).toBe('warning')
      expect(getStatusColor('failed')).toBe('destructive')
      expect(getStatusColor('unknown')).toBe('muted')
    })
  })

  describe('getStatusLabel', () => {
    it('should return correct labels for each status', () => {
      expect(getStatusLabel('completed')).toBe('Completed')
      expect(getStatusLabel('processing')).toBe('Processing')
      expect(getStatusLabel('pending')).toBe('Pending')
      expect(getStatusLabel('failed')).toBe('Failed')
      expect(getStatusLabel('unknown')).toBe('Unknown')
    })
  })
})

import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const ResetPassword = () => {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:4000/api/user/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const json = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(json.error || 'Unable to reset password.')
      } else {
        setMessage(json.message || 'Password reset successful. You can log in now.')
        setPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      setError('Server not reachable. Make sure backend runs on port 4000.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: '520px' }}>
      <h3 className="mb-3">Reset Password</h3>
      <p className="text-muted">Set a new password for your account.</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">New password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Confirm new password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Reset Password'}
        </button>
      </form>
      {message && (
        <div className="alert alert-success mt-3">
          {message} <Link to="/login">Go to login</Link>
        </div>
      )}
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </div>
  )
}

export default ResetPassword

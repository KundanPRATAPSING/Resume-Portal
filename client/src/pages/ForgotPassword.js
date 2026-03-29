import { useState } from 'react'
import { Link } from 'react-router-dom'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [resetLink, setResetLink] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')
    setResetLink('')

    try {
      const response = await fetch('http://localhost:4000/api/user/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const json = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(json.error || 'Unable to send reset link.')
      } else {
        setMessage(json.message || 'If this email is registered, a reset link has been sent.')
        if (json.resetLink) {
          setResetLink(json.resetLink)
        }
      }
    } catch (err) {
      setError('Server not reachable. Make sure backend runs on port 4000.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: '520px' }}>
      <h3 className="mb-3">Forgot Password</h3>
      <p className="text-muted">Enter your email to receive a magic reset link.</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Email address</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>
      {message && <div className="alert alert-success mt-3">{message}</div>}
      {resetLink && (
        <div className="alert alert-warning mt-3">
          Development reset link: <a href={resetLink}>{resetLink}</a>
        </div>
      )}
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      <div className="mt-3">
        <Link to="/login">Back to login</Link>
      </div>
    </div>
  )
}

export default ForgotPassword

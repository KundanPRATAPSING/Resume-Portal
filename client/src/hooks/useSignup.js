import { useState } from 'react'
import { useAuthContext } from './useAuthContext'

export const useSignup = () => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(null)
  const { dispatch } = useAuthContext()

  const signup = async (email, password,role) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:4000/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      })

      const json = await response.json().catch(() => ({}))

      if (!response.ok) {
        setIsLoading(false)
        setError(json.error || 'Signup failed')
        return
      }

      // save the user to local storage
      localStorage.setItem('user', JSON.stringify(json))

      // update the auth context
      dispatch({ type: 'LOGIN', payload: json })
      setIsLoading(false)
    } catch (e) {
      setIsLoading(false)
      setError('Server not reachable. Make sure backend runs on port 4000.')
    }
  }

  return { signup, isLoading, error }
}
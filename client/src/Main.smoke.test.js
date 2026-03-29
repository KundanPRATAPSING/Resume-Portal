import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Mainpage from './pages/Main'

test('renders landing page welcome text', () => {
  render(<Mainpage />)
  expect(screen.getByText(/Welcome to the Official Resume Portal/i)).toBeInTheDocument()
})

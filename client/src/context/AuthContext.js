import { createContext, useReducer, useEffect } from 'react'

export const AuthContext = createContext()
//////here i hve created global auth state using useReducer
export const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN': //login function dispatched
      return { user: action.payload }  //state updated like this
    case 'LOGOUT':
      return { user: null }
    default:
      return state
  }
}

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, { 
    user: null
  })

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))

    if (user) {
      dispatch({ type: 'LOGIN', payload: user }) 
    }
  }, [])

  console.log('AuthContext state:', state)
  
  return ( 
    //wrapped whole app inside this provider so every component can access the auth state

    <AuthContext.Provider value={{ ...state, dispatch }}> 
      { children }
    </AuthContext.Provider>
  )

}
import { DatasContext } from '../context/DataContext'
import { useContext } from 'react'

export const useDatasContext = () => {
  const context = useContext(DatasContext)

  if (!context) {
    throw Error('useDatasContext must be used inside an DatasContextProvider')
  }

  return context
}



////This hook gives me access to the resume data context.
//  So when a new resume is added, 
// I dispatch CREATE_DATA to update the global list — that way, t
// he UI updates immediately without needing to refresh.


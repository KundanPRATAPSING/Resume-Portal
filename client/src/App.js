import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from './hooks/useAuthContext'




// pages & components
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Navbar from './components/Navbar'
import Main from './pages/Main'
import Footer from './components/Footer'
import NotifiCreate from './pages/Notifications'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Companies from './pages/Companies'
import Timeline from './pages/Timeline'
import Today from './pages/Today'
import Profile from './pages/Profile'
import InterviewSlots from './pages/InterviewSlots'
import DocumentCenter from './pages/DocumentCenter'
import OfferComparison from './pages/OfferComparison'
import AIAssistant from './pages/AIAssistant'
import PolicyEngine from './pages/PolicyEngine'
import PlacementTeam from './pages/PlacementTeam'
import Documentation from './pages/Documentation'

import RecruiterForm from './pages/RecruiterForm';


import PlacementStats  from './pages/PlacementStats';


function App() {
  const { user } = useAuthContext() /////used this hook to check whther the current user is logged in or not.

  return (
    <div className="App">
      <BrowserRouter>
        <Navbar />
        <div className="pages">
          <Routes>
            <Route
              path="/user"
              element={
                user
                  ? (user.role === 'admin' ? <Home /> : <Navigate to="/profile" />)
                  : <Navigate to="/" />
              }
            />
            <Route
              path="/profile"
              element={user ? <Profile /> : <Navigate to="/login" />}
            />
            <Route
              path="/login"
              element={!user ? <Login /> : <Navigate to="/user" />}
            />
            <Route
              path="/signup"
              element={!user ? <Signup /> : <Navigate to="/user" />}
            />
            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />
            <Route
              path="/reset-password/:token"
              element={<ResetPassword />}
            />
            <Route path="/"
              element={<Main />}
            />
            <Route path='/user/Notification'
              element={user ? <NotifiCreate /> : <Navigate to="/" />} />

            <Route path='/recruiter-login'
              element={<RecruiterForm />} />

<Route path='/stats'
              element={user ? <PlacementStats /> : <Navigate to="/login" />} />
            <Route
              path="/placement-team"
              element={user ? <PlacementTeam /> : <Navigate to="/login" />}
            />
            <Route
              path="/companies"
              element={user ? <Companies /> : <Navigate to="/login" />}
            />
            <Route
              path="/timeline"
              element={user ? <Timeline /> : <Navigate to="/login" />}
            />
            <Route
              path="/today"
              element={user ? <Today /> : <Navigate to="/login" />}
            />
            <Route
              path="/interview-slots"
              element={user ? <InterviewSlots /> : <Navigate to="/login" />}
            />
            <Route
              path="/documents"
              element={user ? <DocumentCenter /> : <Navigate to="/login" />}
            />
            <Route
              path="/offers"
              element={user ? <OfferComparison /> : <Navigate to="/login" />}
            />
            <Route
              path="/ats-checker"
              element={user ? <AIAssistant /> : <Navigate to="/login" />}
            />
            <Route
              path="/ai-assistant"
              element={<Navigate to="/ats-checker" />}
            />
            <Route
              path="/policy-engine"
              element={user ? <PolicyEngine /> : <Navigate to="/login" />}
            />
            <Route
              path="/documentation"
              element={user ? <Documentation /> : <Navigate to="/login" />}
            />
          </Routes>
        </div>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;

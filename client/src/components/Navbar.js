import { Link, NavLink, useLocation } from 'react-router-dom'
import { useLogout } from '../hooks/useLogout'
import { useAuthContext } from '../hooks/useAuthContext'
import { useEffect, useRef, useState } from 'react'

const Navbar = () => {
  const { logout } = useLogout()
  const { user } = useAuthContext()
  const location = useLocation()
  const [notifCount, setNotifCount] = useState(0)
  const navRef = useRef(null)

  const handleClick = () => {
    logout()
  }
  const profileInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U'
  const navClass = ({ isActive }) => `nav-link-item${isActive ? ' active' : ''}`

  useEffect(() => {
    const fetchNotifCount = async () => {
      if (!user) return;
      if (user.role === 'admin') {
        setNotifCount(0);
        return;
      }

      try {
        const res = await fetch('http://localhost:4000/api/notifications/unreadcount', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setNotifCount(data.count);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifCount();
    const interval = setInterval(fetchNotifCount, 30000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  useEffect(() => {
    const closeDropdowns = () => {
      if (!navRef.current) return
      navRef.current.querySelectorAll('.menu-group details[open]').forEach((node) => node.removeAttribute('open'))
    }

    const handleOutsideClick = (e) => {
      if (!navRef.current) return
      const clickedInside = navRef.current.contains(e.target)
      if (!clickedInside) {
        closeDropdowns()
      } else if (!e.target.closest('.menu-group')) {
        closeDropdowns()
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <header className="header" ref={navRef}>
      <div className="IIITL">
        <div className="iiitl-logo"></div>
        <div className='IIIT-DES'>
          <p>Indian Institute of Information Technology, Lucknow</p>
          <p>भारतीय सूचना प्रौद्योगिकी संस्थान, लखनऊ</p>
          <p className='Nameweb'>Resume-Portal</p>
        </div>
      </div>

      {user && (
        <div>
          <input className="menu-btn" type="checkbox" id="menu-btn" />
          <label className="menu-icon" htmlFor="menu-btn"><span className="navicon"></span></label>
          <ul className="menu">
            <li><NavLink to='/' className={navClass}>Home</NavLink></li>
            <li><NavLink to={user.role === 'admin' ? '/user' : '/profile'} className={navClass}>{user.role === 'admin' ? 'Dashboard' : 'My Profile'}</NavLink></li>
            <li><NavLink to='/companies' className={navClass}>Companies</NavLink></li>
            <li><NavLink to='/today' className={navClass}>Today</NavLink></li>
            <li><NavLink to='/timeline' className={navClass}>Timeline</NavLink></li>

            <li className="menu-group">
              <details>
                <summary>Career Tools</summary>
                <div className="menu-group-items">
                  <NavLink to='/interview-slots' className={navClass}>Interview Slots</NavLink>
                  <NavLink to='/documents' className={navClass}>Document Center</NavLink>
                  <NavLink to='/stats' className={navClass}>Placement Analytics</NavLink>
                  <NavLink to='/placement-team' className={navClass}>Placement Team</NavLink>
                  <NavLink to='/offers' className={navClass}>Offer Compare</NavLink>
                  <NavLink to='/ats-checker' className={navClass}>ATS Checker</NavLink>
                </div>
              </details>
            </li>

            {user.role === 'admin' && (
              <li className="menu-group">
                <details>
                  <summary>Admin</summary>
                  <div className="menu-group-items">
                    <NavLink to='/policy-engine' className={navClass}>Policy Engine</NavLink>
                  </div>
                </details>
              </li>
            )}

            <li>
              <NavLink to='/user/Notification' className={({ isActive }) => `notif-link${isActive ? ' active' : ''}`}>
                Notifications
                {user.role !== 'admin' && notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
              </NavLink>
            </li>
            <li className="nav-account-actions">
              <NavLink to={user.role === 'admin' ? '/user' : '/profile'} className={({ isActive }) => `profile-avatar-btn${isActive ? ' active' : ''}`} title="My Profile">
                {profileInitial}
              </NavLink>
              <button className='Logout' type="button" onClick={handleClick}>Logout</button>
            </li>
          </ul>
        </div>
      )}

      {!user && (
        <div>
          <input className="menu-btn" type="checkbox" id="menu-btn" />
          <label className="menu-icon" htmlFor="menu-btn"><span className="navicon"></span></label>
          <ul className="menu">
            <li><Link to='/'>Home</Link></li>
            <li><Link to='/login'>Login</Link></li>
            <li><Link to='/signup'>Register</Link></li>
          </ul>
        </div>
      )}
    </header>
  )
}

export default Navbar
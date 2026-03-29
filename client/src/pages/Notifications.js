import { useAuthContext } from "../hooks/useAuthContext";
import NotifiCreate from '../components/Notifications_create'
import NotifiList from "../components/Notifications_list";
import { useState } from "react";


const Notification = () => {
    const { user } = useAuthContext()
    const [refreshTick, setRefreshTick] = useState(0)
    if(user.role === 'admin'){
    return (
        <div className="tool-page">
        <div className="container py-4 tool-page-content">
        <div className="notifications-shell mb-3">
          <h2 className="mb-1">Notifications Control Center</h2>
          <p className="mb-0 text-light">Create targeted notifications and manage all published announcements.</p>
        </div>
        <NotifiCreate onCreated={() => setRefreshTick((x) => x + 1)} />
        <NotifiList refreshTick={refreshTick}/>
        </div>
        </div>

     );
    }
    else{
        return(
            <div className="tool-page">
            <div className="container py-4 tool-page-content">
            <div className="notifications-shell mb-3">
              <h2 className="mb-1">Notifications</h2>
              <p className="mb-0 text-light">Stay updated with drives, schedules and placement announcements.</p>
            </div>
            <NotifiList refreshTick={refreshTick}/>
            </div>
            </div>
        )
    }
}
 
export default Notification;

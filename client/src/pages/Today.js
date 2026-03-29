import { useEffect, useState } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000'

const Today = () => {
  const { user } = useAuthContext()
  const [data, setData] = useState({ totalCompaniesToday: 0, items: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!user?.token) return
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/api/today/overview`, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Unable to fetch today overview')
        setData(json)
      } catch (e) {
        setError(e.message || 'Unable to fetch today overview')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.token])

  return (
    <div className="tool-page">
      <div className="container py-4 tool-page-content">
        <h3 className="text-white mb-1">Today’s Placement Desk</h3>
        <p className="text-light mb-3">Live view: which company exam is happening, completed stages, and remaining stages.</p>

        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <p className="text-muted mb-1">Companies Live Today</p>
                <h4 className="mb-0">{data.totalCompaniesToday || 0}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <p className="text-muted mb-1">Total Rounds Running</p>
                <h4 className="mb-0">{(data.items || []).reduce((sum, item) => sum + (item.rounds?.length || 0), 0)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <p className="text-muted mb-1">Interviews/Slots Today</p>
                <h4 className="mb-0">{(data.items || []).reduce((sum, item) => sum + (item.slotsToday?.length || 0), 0)}</h4>
              </div>
            </div>
          </div>
        </div>

        {loading && <div className="alert alert-info">Loading today data...</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && (
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Today’s Company Exams</h5>
              {(data.items || []).length === 0 ? (
                <p className="text-muted mb-0">No company drive scheduled for today.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-striped align-middle">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Role</th>
                        <th>Rounds</th>
                        <th>Stages Completed</th>
                        <th>Stages Remaining</th>
                        <th>Applications</th>
                        <th>My Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item) => (
                        <tr key={item.companyId}>
                          <td>{item.companyName}</td>
                          <td>{item.roleOffered}</td>
                          <td>{(item.rounds || []).join(' -> ') || '-'}</td>
                          <td>{item.stagesCompleted}</td>
                          <td>{item.stagesRemaining}</td>
                          <td>{item.totalApplications}</td>
                          <td>
                            {item.myStatus
                              ? `${item.myStatus.status}${item.myStatus.currentRound ? ` (${item.myStatus.currentRound})` : ''}`
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Today

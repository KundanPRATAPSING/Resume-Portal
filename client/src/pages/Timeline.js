import { useEffect, useMemo, useState } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'

const API_BASE = 'http://localhost:4000'
const FILTERS = ['all', 'deadline', 'drive', 'notification']

const buildCalendarCells = (year, month) => {
  const firstDay = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0).getDate()
  const startWeekDay = firstDay.getDay()
  const cells = []

  for (let i = 0; i < startWeekDay; i += 1) cells.push(null)
  for (let day = 1; day <= lastDate; day += 1) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const toKey = (date) => {
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const formatFullDate = (date) =>
  new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

const Timeline = () => {
  const { user } = useAuthContext()
  const [companies, setCompanies] = useState([])
  const [notifications, setNotifications] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const today = new Date()
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth())
  const [selectedDayKey, setSelectedDayKey] = useState(toKey(today))

  useEffect(() => {
    const load = async () => {
      if (!user?.token) return
      setLoading(true)
      setError('')
      try {
        const requests = [
          fetch(`${API_BASE}/api/companies`, { headers: { Authorization: `Bearer ${user.token}` } }),
          fetch(`${API_BASE}/api/notifications`, { headers: { Authorization: `Bearer ${user.token}` } })
        ]
        if (user.role !== 'admin') {
          requests.push(fetch(`${API_BASE}/api/company-applications/mine`, { headers: { Authorization: `Bearer ${user.token}` } }))
        }

        const responses = await Promise.all(requests)
        const payloads = await Promise.all(responses.map((r) => r.json()))

        if (!responses[0].ok) throw new Error(payloads[0].error || 'Unable to fetch companies')
        if (!responses[1].ok) throw new Error(payloads[1].error || 'Unable to fetch notifications')

        setCompanies(Array.isArray(payloads[0]) ? payloads[0] : (payloads[0].items || []))
        setNotifications(Array.isArray(payloads[1]) ? payloads[1] : (payloads[1].items || []))
        setMyApplications(user.role !== 'admin' ? (payloads[2] || []) : [])
      } catch (err) {
        setError(err.message || 'Unable to load timeline')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.token, user?.role])

  const applicationMap = useMemo(
    () =>
      myApplications.reduce((acc, item) => {
        acc[item.companyId] = item
        return acc
      }, {}),
    [myApplications]
  )

  const allEvents = useMemo(() => {
    const companyEvents = companies.flatMap((company) => {
      const out = []
      const app = applicationMap[company._id]
      if (company.applicationDeadline) {
        out.push({
          kind: 'deadline',
          date: new Date(company.applicationDeadline),
          title: `${company.companyName} application deadline`,
          subtitle: `${company.roleOffered}${app?.status ? ` | My status: ${app.status}` : ''}`,
          companyId: company._id
        })
      }
      if (company.driveDate) {
        out.push({
          kind: 'drive',
          date: new Date(company.driveDate),
          title: `${company.companyName} drive day`,
          subtitle: `${company.roleOffered}${app?.currentRound ? ` | Round: ${app.currentRound}` : ''}`,
          companyId: company._id
        })
      }
      return out
    })

    const notificationEvents = notifications.map((item) => ({
      kind: 'notification',
      date: new Date(item.createdAt),
      title: item.title,
      subtitle: item.description,
      notificationId: item._id
    }))

    return [...companyEvents, ...notificationEvents].sort((a, b) => a.date - b.date)
  }, [companies, notifications, applicationMap])

  const events = useMemo(
    () => (filter === 'all' ? allEvents : allEvents.filter((event) => event.kind === filter)),
    [allEvents, filter]
  )

  const eventsByDate = useMemo(() => {
    const map = {}
    for (const event of events) {
      const key = toKey(event.date)
      if (!map[key]) map[key] = []
      map[key].push(event)
    }
    return map
  }, [events])

  const selectedDayEvents = eventsByDate[selectedDayKey] || []

  const next7DaysEvents = useMemo(() => {
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 7)
    return events.filter((event) => event.date >= start && event.date <= end)
  }, [events])

  const myStatusSummary = useMemo(() => {
    const summary = {}
    for (const app of myApplications) {
      summary[app.status] = (summary[app.status] || 0) + 1
    }
    return summary
  }, [myApplications])

  const calendarCells = useMemo(
    () => buildCalendarCells(calendarYear, calendarMonth),
    [calendarYear, calendarMonth]
  )

  const monthName = new Date(calendarYear, calendarMonth, 1).toLocaleString(undefined, { month: 'long' })

  const getKindLabel = (kind) => {
    if (kind === 'deadline') return { text: 'Deadline', badge: 'bg-danger' }
    if (kind === 'drive') return { text: 'Drive', badge: 'bg-primary' }
    return { text: 'Notification', badge: 'bg-info text-dark' }
  }

  return (
    <div className="tool-page">
      <div className="container py-4 tool-page-content">
      <div className="d-flex flex-wrap justify-content-between align-items-start mb-3">
        <div>
          <h3 className="mb-1 text-white">Placement Timeline Planner</h3>
          <p className="text-light mb-0">
            Use this page to see what needs action now: deadlines, drive days, and important notices.
          </p>
        </div>
        <div className="d-flex gap-2 mt-2 mt-md-0">
          {FILTERS.map((key) => (
            <button
              key={key}
              className={`btn btn-sm ${filter === key ? 'btn-dark' : 'btn-outline-dark'}`}
              onClick={() => setFilter(key)}
            >
              {key === 'all' ? 'All' : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-white">Loading timeline...</p>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !error && (
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        if (calendarMonth === 0) {
                          setCalendarMonth(11)
                          setCalendarYear((y) => y - 1)
                        } else {
                          setCalendarMonth((m) => m - 1)
                        }
                      }}
                    >
                      Prev
                    </button>
                    <h6 className="mb-0">{monthName} {calendarYear}</h6>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        if (calendarMonth === 11) {
                          setCalendarMonth(0)
                          setCalendarYear((y) => y + 1)
                        } else {
                          setCalendarMonth((m) => m + 1)
                        }
                      }}
                    >
                      Next
                    </button>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {
                      const now = new Date()
                      setCalendarMonth(now.getMonth())
                      setCalendarYear(now.getFullYear())
                      setSelectedDayKey(toKey(now))
                    }}
                  >
                    Today
                  </button>
                </div>

                <div className="row row-cols-7 g-1 text-center small fw-semibold mb-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="col">{d}</div>
                  ))}
                </div>

                <div className="row row-cols-7 g-1">
                  {calendarCells.map((date, idx) => {
                    const key = date ? toKey(date) : `empty-${idx}`
                    const dayEvents = date ? (eventsByDate[key] || []) : []
                    const isToday = date && key === toKey(new Date())
                    const isSelected = date && key === selectedDayKey
                    return (
                      <div key={key} className="col">
                        <button
                          type="button"
                          onClick={() => date && setSelectedDayKey(key)}
                          disabled={!date}
                          className="w-100 border rounded p-1 text-start bg-white"
                          style={{
                            minHeight: '74px',
                            opacity: date ? 1 : 0.5,
                            outline: isSelected ? '2px solid #212529' : 'none',
                            background: isToday ? '#f8f9ff' : '#fff'
                          }}
                        >
                          {date && (
                            <>
                              <div className="small fw-semibold">{date.getDate()}</div>
                              <div className="d-flex flex-wrap gap-1 mt-1">
                                {dayEvents.slice(0, 3).map((event, i) => {
                                  const label = getKindLabel(event.kind)
                                  return (
                                    <span key={`${event.title}-${i}`} className={`badge ${label.badge}`}>
                                      {label.text[0]}
                                    </span>
                                  )
                                })}
                                {dayEvents.length > 3 && (
                                  <span className="badge bg-secondary">+{dayEvents.length - 3}</span>
                                )}
                              </div>
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
                <div className="small text-muted mt-2">
                  <span className="badge bg-danger me-1">D</span> Deadline
                  <span className="badge bg-primary ms-3 me-1">D</span> Drive
                  <span className="badge bg-info text-dark ms-3 me-1">N</span> Notification
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm border-0 mb-3">
              <div className="card-body">
                <h6 className="mb-2">Your next 7 days</h6>
                {next7DaysEvents.length === 0 ? (
                  <p className="text-muted mb-0">No events in the next 7 days.</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {next7DaysEvents.slice(0, 6).map((event, idx) => {
                      const label = getKindLabel(event.kind)
                      return (
                        <li key={`${event.title}-${idx}`} className="list-group-item px-0 py-2">
                          <div className="d-flex justify-content-between">
                            <div>
                              <span className={`badge ${label.badge} me-1`}>{label.text}</span>
                              <span className="small">{event.title}</span>
                            </div>
                            <span className="small text-muted">{formatDistanceToNow(event.date, { addSuffix: true })}</span>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="card shadow-sm border-0 mb-3">
              <div className="card-body">
                <h6 className="mb-2">Agenda for {selectedDayKey}</h6>
                {selectedDayEvents.length === 0 ? (
                  <p className="text-muted mb-0">No events for this day.</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {selectedDayEvents.map((event, idx) => {
                      const label = getKindLabel(event.kind)
                      return (
                        <li key={`${event.title}-${idx}`} className="list-group-item px-0 py-2">
                          <span className={`badge ${label.badge} me-1`}>{label.text}</span>
                          <strong className="small">{event.title}</strong>
                          {event.subtitle && <div className="small text-muted mt-1">{event.subtitle}</div>}
                          <div className="small text-muted">{formatFullDate(event.date)}</div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>

            {user?.role !== 'admin' && (
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="mb-2">My application pipeline</h6>
                  {Object.keys(myStatusSummary).length === 0 ? (
                    <p className="text-muted mb-0">Start updating your status from Companies page.</p>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {Object.entries(myStatusSummary).map(([status, count]) => (
                        <span key={status} className="badge bg-dark-subtle text-dark border">
                          {status}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default Timeline

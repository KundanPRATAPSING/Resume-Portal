import { useEffect, useState } from 'react'
import { useDatasContext } from "../hooks/useDatasContext"
import { useAuthContext } from "../hooks/useAuthContext"
import DataDetails from '../components/DataDetails'
import DataForm from '../components/DataForm'

const API_BASE_CANDIDATES = [
  process.env.REACT_APP_API_URL,
  'http://localhost:4000',
  'http://localhost:4001',
  ''
].filter(Boolean)

const apiFetch = async (path, options = {}) => {
  let lastError = null
  for (const base of API_BASE_CANDIDATES) {
    try {
      return await fetch(`${base}${path}`, options)
    } catch (err) {
      lastError = err
    }
  }
  throw lastError || new Error('Failed to fetch')
}

const readJson = async (response) => {
  try {
    return await response.json()
  } catch (e) {
    return {}
  }
}

const Home = () => {
  const { datas, dispatch } = useDatasContext()
  const { user } = useAuthContext()
  const [dashboardStats, setDashboardStats] = useState({
    notifications: 0,
    companies: 0,
    upcomingDeadlines: 0,
    shortlists: 0
  })
  const [hasPreviousData, setHasPreviousData] = useState(false)

  // Admin scalable list state
  const [adminItems, setAdminItems] = useState([])
  const [adminPage, setAdminPage] = useState(1)
  const [adminTotalPages, setAdminTotalPages] = useState(1)
  const [adminQuery, setAdminQuery] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminRealtime, setAdminRealtime] = useState({
    students: 0,
    companies: 0,
    applications: 0,
    shortlists: 0,
    offers: 0,
    oaCleared: 0,
    interviews: 0
  })
  const [adminCompanies, setAdminCompanies] = useState([])
  const [editingStudentId, setEditingStudentId] = useState('')
  const [adminActionMsg, setAdminActionMsg] = useState('')
  const [adminStudentForm, setAdminStudentForm] = useState({
    FullName: '',
    email: '',
    password: 'Student@123',
    Rollno: '',
    BatchYear: '2021',
    Branch: 'Computer Science',
    Cgpa: '',
    PhotoUrl: '',
    ResumeUrl: ''
  })
  const [adminAppForm, setAdminAppForm] = useState({
    rollNo: '',
    companyId: '',
    status: 'Applied',
    currentRound: '',
    notes: ''
  })
  const [adminRefreshTick, setAdminRefreshTick] = useState(0)

  useEffect(() => {
    if (!user?.token || user.role === 'admin') return
    const getExistingData = async () => {
      const existingDatasResponse = await apiFetch('/api/data', {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      const existingDatas = await readJson(existingDatasResponse)
      setHasPreviousData((existingDatas?.length || 0) > 0)
    }
    getExistingData()
  }, [user])

  useEffect(() => {
    if (!user?.token || user.role === 'admin') return
    const fetchDatas = async () => {
      const response = await apiFetch('/api/data', {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      const json = await readJson(response)
      if (response.ok) {
        dispatch({ type: 'SET_DATAS', payload: json })
      }
    }
    fetchDatas()
  }, [dispatch, user])

  useEffect(() => {
    if (!user?.token || user.role !== 'admin') return
    const fetchAdminDatas = async () => {
      setAdminLoading(true)
      setAdminError('')
      try {
        const params = new URLSearchParams({
          page: String(adminPage),
          limit: '20'
        })
        if (adminQuery.trim()) params.set('q', adminQuery.trim())

        const response = await apiFetch(`/api/data/admin?${params.toString()}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
        const json = await readJson(response)
        if (!response.ok) {
          throw new Error(json.error || 'Unable to load students.')
        }
        setAdminItems(json.items || [])
        setAdminTotalPages(json.totalPages || 1)
      } catch (e) {
        setAdminError(e.message || 'Unable to load students.')
      } finally {
        setAdminLoading(false)
      }
    }
    fetchAdminDatas()
  }, [user?.token, user?.role, adminPage, adminQuery, adminRefreshTick])

  useEffect(() => {
    if (!user?.token || user.role !== 'admin') return
    const loadRealtime = async () => {
      try {
        const [overviewRes, companiesRes] = await Promise.all([
          apiFetch('/api/data/admin/realtime-overview', {
            headers: { Authorization: `Bearer ${user.token}` }
          }),
          apiFetch('/api/companies?page=1&limit=200&sortBy=driveDate&sortDir=desc', {
            headers: { Authorization: `Bearer ${user.token}` }
          })
        ])
        const overviewJson = await readJson(overviewRes)
        const companiesJson = await readJson(companiesRes)
        if (overviewRes.ok) {
          setAdminRealtime({
            students: overviewJson.students || 0,
            companies: overviewJson.companies || 0,
            applications: overviewJson.applications || 0,
            shortlists: overviewJson.shortlists || 0,
            offers: overviewJson.offers || 0,
            oaCleared: overviewJson.oaCleared || 0,
            interviews: overviewJson.interviews || 0
          })
        }
        if (companiesRes.ok) {
          setAdminCompanies(Array.isArray(companiesJson) ? companiesJson : (companiesJson.items || []))
        }
      } catch (e) {
        // keep admin page resilient
      }
    }
    loadRealtime()
    const interval = setInterval(loadRealtime, 10000)
    return () => clearInterval(interval)
  }, [user?.token, user?.role, adminRefreshTick])

  useEffect(() => {
    if (!user?.token) return
    const loadStats = async () => {
      try {
        const [notifRes, companiesRes] = await Promise.all([
          apiFetch('/api/notifications', { headers: { Authorization: `Bearer ${user.token}` } }),
          apiFetch('/api/companies', { headers: { Authorization: `Bearer ${user.token}` } })
        ])

        const notifJson = await readJson(notifRes)
        const companiesJson = await readJson(companiesRes)
        if (!notifRes.ok || !companiesRes.ok) return
        const notifications = Array.isArray(notifJson) ? notifJson : (notifJson.items || [])
        const companies = Array.isArray(companiesJson) ? companiesJson : (companiesJson.items || [])

        const now = new Date()
        const upcomingDeadlines = companies.filter((c) =>
          c.applicationDeadline && new Date(c.applicationDeadline) >= now
        ).length
        const shortlists = user.role === 'admin'
          ? companies.reduce((sum, c) => sum + ((c.shortlistedRollNos || []).length), 0)
          : companies.filter((c) => c.isShortlisted).length

        setDashboardStats({
          notifications: notifications.length,
          companies: companies.length,
          upcomingDeadlines,
          shortlists
        })
      } catch (e) {
        // keep dashboard resilient if stats endpoints fail
      }
    }
    loadStats()
  }, [user])

  const handleAdminDelete = async (id) => {
    if (!user?.token) return
    try {
      const response = await apiFetch(`/api/data/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      })
      const json = await readJson(response)
      if (!response.ok) throw new Error(json.error || 'Delete failed.')
      setAdminItems((prev) => prev.filter((item) => item._id !== id))
      setAdminRefreshTick((x) => x + 1)
    } catch (e) {
      setAdminError(e.message || 'Delete failed.')
    }
  }

  const handleAdminStudentSubmit = async (e) => {
    e.preventDefault()
    if (!user?.token || user.role !== 'admin') return
    setAdminActionMsg('')
    try {
      const path = editingStudentId ? `/api/data/admin/${editingStudentId}` : '/api/data/admin/create-student'
      const method = editingStudentId ? 'PUT' : 'POST'
      const payload = { ...adminStudentForm }
      if (method === 'PUT') {
        delete payload.email
        delete payload.password
      }
      const response = await apiFetch(path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      })
      const json = await readJson(response)
      if (!response.ok) throw new Error(json.error || 'Action failed.')
      setAdminActionMsg(editingStudentId ? 'Student profile updated.' : 'Student added successfully.')
      setEditingStudentId('')
      setAdminStudentForm({
        FullName: '',
        email: '',
        password: 'Student@123',
        Rollno: '',
        BatchYear: '2021',
        Branch: 'Computer Science',
        Cgpa: '',
        PhotoUrl: '',
        ResumeUrl: ''
      })
      setAdminRefreshTick((x) => x + 1)
    } catch (e) {
      setAdminActionMsg(e.message || 'Action failed.')
    }
  }

  const handleAdminAppSubmit = async (e) => {
    e.preventDefault()
    if (!user?.token || user.role !== 'admin') return
    setAdminActionMsg('')
    try {
      const response = await apiFetch('/api/data/admin/student-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(adminAppForm)
      })
      const json = await readJson(response)
      if (!response.ok) throw new Error(json.error || 'Unable to update application.')
      setAdminActionMsg('Student application status updated.')
      setAdminRefreshTick((x) => x + 1)
    } catch (e) {
      setAdminActionMsg(e.message || 'Unable to update application.')
    }
  }

  if (user.role !== 'admin') {
    return (
      <div className="home">
        <div className="container mb-3">
          <div className="row g-3">
            <div className="col-md-3"><div className="card shadow-sm border-0"><div className="card-body"><p className="text-muted mb-1">Notifications</p><h4 className="mb-0">{dashboardStats.notifications}</h4></div></div></div>
            <div className="col-md-3"><div className="card shadow-sm border-0"><div className="card-body"><p className="text-muted mb-1">Company Drives</p><h4 className="mb-0">{dashboardStats.companies}</h4></div></div></div>
            <div className="col-md-3"><div className="card shadow-sm border-0"><div className="card-body"><p className="text-muted mb-1">Upcoming Deadlines</p><h4 className="mb-0">{dashboardStats.upcomingDeadlines}</h4></div></div></div>
            <div className="col-md-3"><div className="card shadow-sm border-0"><div className="card-body"><p className="text-muted mb-1">My Shortlists</p><h4 className="mb-0">{dashboardStats.shortlists}</h4></div></div></div>
          </div>
        </div>
        <div className='master-class'>
          {hasPreviousData === false || !datas ? (
            <DataForm setHasPreviousData={setHasPreviousData} />
          ) : (
            <div className="datas">
              {datas && datas.map((data) => (
                <DataDetails setHasPreviousData={setHasPreviousData} key={data._id} data={data} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="home admin-dashboard">
      <div className="container mb-3">
        <div className="row g-3">
          <div className="col-md-3"><div className="card shadow-sm border-0"><div className="card-body"><p className="text-muted mb-1">Students</p><h4 className="mb-0">{adminRealtime.students}</h4></div></div></div>
          <div className="col-md-3"><div className="card shadow-sm border-0"><div className="card-body"><p className="text-muted mb-1">Applications</p><h4 className="mb-0">{adminRealtime.applications}</h4></div></div></div>
          <div className="col-md-3"><div className="card shadow-sm border-0"><div className="card-body"><p className="text-muted mb-1">OA Cleared</p><h4 className="mb-0">{adminRealtime.oaCleared}</h4></div></div></div>
          <div className="col-md-3"><div className="card shadow-sm border-0"><div className="card-body"><p className="text-muted mb-1">Offers</p><h4 className="mb-0">{adminRealtime.offers}</h4></div></div></div>
        </div>
      </div>

      <center><h4 className='a'>Admin Page</h4></center>

      <div className="container">
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Admin Control Center</h5>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setAdminRefreshTick((x) => x + 1)}
              >
                Refresh Live Stats
              </button>
            </div>
            {adminActionMsg && <div className="alert alert-info py-2 mb-3">{adminActionMsg}</div>}
            <div className="row g-3">
              <div className="col-lg-7">
                <h6>{editingStudentId ? 'Update Student' : 'Add Student'}</h6>
                <form onSubmit={handleAdminStudentSubmit}>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <input className="form-control" placeholder="Full name" value={adminStudentForm.FullName} onChange={(e) => setAdminStudentForm((p) => ({ ...p, FullName: e.target.value }))} required />
                    </div>
                    <div className="col-md-4">
                      <input className="form-control" placeholder="Roll no" value={adminStudentForm.Rollno} onChange={(e) => setAdminStudentForm((p) => ({ ...p, Rollno: e.target.value }))} required />
                    </div>
                    <div className="col-md-4">
                      <input className="form-control" type="email" placeholder="Email" value={adminStudentForm.email} onChange={(e) => setAdminStudentForm((p) => ({ ...p, email: e.target.value }))} required={!editingStudentId} disabled={!!editingStudentId} />
                    </div>
                    <div className="col-md-3">
                      <input className="form-control" placeholder="Password" value={adminStudentForm.password} onChange={(e) => setAdminStudentForm((p) => ({ ...p, password: e.target.value }))} required={!editingStudentId} disabled={!!editingStudentId} />
                    </div>
                    <div className="col-md-3">
                      <input className="form-control" type="number" placeholder="Batch" value={adminStudentForm.BatchYear} onChange={(e) => setAdminStudentForm((p) => ({ ...p, BatchYear: e.target.value }))} required />
                    </div>
                    <div className="col-md-3">
                      <select className="form-select" value={adminStudentForm.Branch} onChange={(e) => setAdminStudentForm((p) => ({ ...p, Branch: e.target.value }))}>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Computer Science and Artificial Intelligence">Computer Science and AI</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Computer Science and Business">Computer Science and Business</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <input className="form-control" type="number" min="0" max="10" step="0.01" placeholder="CGPA" value={adminStudentForm.Cgpa} onChange={(e) => setAdminStudentForm((p) => ({ ...p, Cgpa: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <input className="form-control" placeholder="Photo URL (optional)" value={adminStudentForm.PhotoUrl} onChange={(e) => setAdminStudentForm((p) => ({ ...p, PhotoUrl: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <input className="form-control" placeholder="Resume URL (optional)" value={adminStudentForm.ResumeUrl} onChange={(e) => setAdminStudentForm((p) => ({ ...p, ResumeUrl: e.target.value }))} />
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-2">
                    <button className="btn btn-sm btn-primary">{editingStudentId ? 'Save Student' : 'Add Student'}</button>
                    {editingStudentId && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setEditingStudentId('')
                          setAdminStudentForm({
                            FullName: '',
                            email: '',
                            password: 'Student@123',
                            Rollno: '',
                            BatchYear: '2021',
                            Branch: 'Computer Science',
                            Cgpa: '',
                            PhotoUrl: '',
                            ResumeUrl: ''
                          })
                        }}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>
              <div className="col-lg-5">
                <h6>Update Student Application</h6>
                <form onSubmit={handleAdminAppSubmit}>
                  <div className="row g-2">
                    <div className="col-12">
                      <input className="form-control" placeholder="Student Roll No" value={adminAppForm.rollNo} onChange={(e) => setAdminAppForm((p) => ({ ...p, rollNo: e.target.value }))} required />
                    </div>
                    <div className="col-12">
                      <select className="form-select" value={adminAppForm.companyId} onChange={(e) => setAdminAppForm((p) => ({ ...p, companyId: e.target.value }))} required>
                        <option value="">Select Company</option>
                        {adminCompanies.map((c) => (
                          <option key={c._id} value={c._id}>{c.companyName} - {c.roleOffered}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <select className="form-select" value={adminAppForm.status} onChange={(e) => setAdminAppForm((p) => ({ ...p, status: e.target.value }))}>
                        <option value="Not Applied">Not Applied</option>
                        <option value="Applied">Applied</option>
                        <option value="OA Cleared">OA Cleared</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <input className="form-control" placeholder="Current round" value={adminAppForm.currentRound} onChange={(e) => setAdminAppForm((p) => ({ ...p, currentRound: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <textarea className="form-control" rows="2" placeholder="Notes" value={adminAppForm.notes} onChange={(e) => setAdminAppForm((p) => ({ ...p, notes: e.target.value }))} />
                    </div>
                  </div>
                  <button className="btn btn-sm btn-success mt-2">Update Application</button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="mb-0">Student Records</h5>
              <input
                className="form-control"
                style={{ maxWidth: '340px' }}
                placeholder="Search by Roll no or Branch"
                value={adminQuery}
                onChange={(e) => {
                  setAdminPage(1)
                  setAdminQuery(e.target.value)
                }}
              />
            </div>
            {adminError && <div className="alert alert-danger mt-3 mb-0">{adminError}</div>}
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {adminLoading ? (
              <p className="text-muted mb-0">Loading students...</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-striped align-middle">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Roll No</th>
                      <th>Batch</th>
                      <th>Branch</th>
                      <th>CGPA</th>
                      <th>Resume</th>
                      <th>Uploaded</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminItems.map((item) => (
                      <tr key={item._id}>
                        <td>{item.FullName || '-'}</td>
                        <td>{item.Rollno}</td>
                        <td>{item.BatchYear}</td>
                        <td>{item.Branch}</td>
                        <td>{item.Cgpa ?? '-'}</td>
                        <td>
                          <a href={item.ResumeSignedUrl || item.ResumeUrl || item.ResumeLink} target="_blank" rel="noreferrer">
                            {item.ResumeFileName || 'View Resume'}
                          </a>
                        </td>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => {
                              setEditingStudentId(item._id)
                              setAdminStudentForm({
                                FullName: item.FullName || '',
                                email: '',
                                password: 'Student@123',
                                Rollno: item.Rollno || '',
                                BatchYear: String(item.BatchYear || '2021'),
                                Branch: item.Branch || 'Computer Science',
                                Cgpa: item.Cgpa === undefined || item.Cgpa === null ? '' : String(item.Cgpa),
                                PhotoUrl: item.PhotoUrl || '',
                                ResumeUrl: item.ResumeUrl || ''
                              })
                            }}
                          >
                            Edit
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleAdminDelete(item._id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {adminItems.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-muted">No students found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center mt-2">
              <small className="text-muted">Page {adminPage} of {adminTotalPages}</small>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={adminPage <= 1}
                  onClick={() => setAdminPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={adminPage >= adminTotalPages}
                  onClick={() => setAdminPage((p) => Math.min(adminTotalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
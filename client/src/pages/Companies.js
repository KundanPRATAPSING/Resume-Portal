import { useEffect, useMemo, useState } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'

const API_BASE = 'http://localhost:4000'
const APPLICATION_STATUSES = ['Not Applied', 'Applied', 'OA Cleared', 'Interview', 'Offer', 'Rejected']

const parseRollNos = (input) =>
  input
    .split(',')
    .map((roll) => roll.trim().toUpperCase())
    .filter(Boolean)

const parseList = (input) =>
  input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const downloadCsv = (filename, rows) => {
  const processCell = (value) => {
    const text = String(value ?? '')
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`
    }
    return text
  }
  const csvContent = rows.map((row) => row.map(processCell).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const getTodayStart = () => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

const Companies = () => {
  const { user } = useAuthContext()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState('')
  const [applicationMap, setApplicationMap] = useState({})
  const [statusDrafts, setStatusDrafts] = useState({})
  const [shortlistDrafts, setShortlistDrafts] = useState({})
  const [eligibilityPreview, setEligibilityPreview] = useState(null)
  const [eligibilityLoading, setEligibilityLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [hiringTypeFilter, setHiringTypeFilter] = useState('All')
  const [sortBy, setSortBy] = useState('driveDateDesc')
  const [monthFilter, setMonthFilter] = useState('All')
  const [minPackageFilter, setMinPackageFilter] = useState('')
  const [shortlistedOnly, setShortlistedOnly] = useState(false)

  const [form, setForm] = useState({
    companyName: '',
    roleOffered: '',
    packageLPA: '',
    location: '',
    hiringType: 'Placement',
    driveDate: '',
    applicationDeadline: '',
    eligibility: '',
    minCgpa: '',
    eligibleBranchesInput: '',
    eligibleBatchYearsInput: '',
    requiredSkillsInput: '',
    openings: '',
    roundsInput: '',
    description: '',
    shortlistedRollNosInput: ''
  })

  const fetchCompanies = async () => {
    if (!user?.token) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/api/companies?page=1&limit=500&sortBy=driveDate&sortDir=desc`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      })
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error || 'Unable to fetch companies.')
      }
      setCompanies(Array.isArray(json) ? json : (json.items || []))
    } catch (err) {
      setError(err.message || 'Unable to fetch companies.')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyApplications = async () => {
    if (!user?.token || user?.role === 'admin') return
    try {
      const response = await fetch(`${API_BASE}/api/company-applications/mine`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      })
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error || 'Unable to fetch application statuses.')
      }
      const map = json.reduce((acc, item) => {
        acc[item.companyId] = item
        return acc
      }, {})
      setApplicationMap(map)
      setStatusDrafts(
        json.reduce((acc, item) => {
          acc[item.companyId] = {
            status: item.status || 'Not Applied',
            currentRound: item.currentRound || '',
            notes: item.notes || ''
          }
          return acc
        }, {})
      )
    } catch (err) {
      console.error(err.message)
    }
  }

  useEffect(() => {
    fetchCompanies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token])

  useEffect(() => {
    fetchMyApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, companies.length])

  const handleCreateCompany = async (e) => {
    e.preventDefault()
    if (user?.role !== 'admin') return

    setFormError('')
    try {
      const payload = {
        companyName: form.companyName,
        roleOffered: form.roleOffered,
        packageLPA: Number(form.packageLPA),
        location: form.location,
        hiringType: form.hiringType,
        driveDate: form.driveDate,
        applicationDeadline: form.applicationDeadline || undefined,
        eligibility: form.eligibility,
        minCgpa: form.minCgpa === '' ? undefined : Number(form.minCgpa),
        eligibleBranches: parseList(form.eligibleBranchesInput),
        eligibleBatchYears: parseList(form.eligibleBatchYearsInput).map((x) => Number(x)).filter((x) => !Number.isNaN(x)),
        requiredSkills: parseList(form.requiredSkillsInput),
        openings: form.openings === '' ? undefined : Number(form.openings),
        rounds: parseList(form.roundsInput),
        description: form.description,
        shortlistedRollNos: parseRollNos(form.shortlistedRollNosInput)
      }

      const response = await fetch(`${API_BASE}/api/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      })
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error || 'Unable to create company.')
      }

      setCompanies((prev) => [json, ...prev])
      setForm({
        companyName: '',
        roleOffered: '',
        packageLPA: '',
        location: '',
        hiringType: 'Placement',
        driveDate: '',
        applicationDeadline: '',
        eligibility: '',
        minCgpa: '',
        eligibleBranchesInput: '',
        eligibleBatchYearsInput: '',
        requiredSkillsInput: '',
        openings: '',
        roundsInput: '',
        description: '',
        shortlistedRollNosInput: ''
      })
    } catch (err) {
      setFormError(err.message || 'Unable to create company.')
    }
  }

  const handleSaveShortlist = async (companyId) => {
    try {
      const response = await fetch(`${API_BASE}/api/companies/${companyId}/shortlist`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          shortlistedRollNos: parseRollNos(shortlistDrafts[companyId] || '')
        })
      })
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error || 'Unable to update shortlist.')
      }
      setCompanies((prev) => prev.map((c) => (c._id === companyId ? json : c)))
    } catch (err) {
      alert(err.message || 'Unable to update shortlist.')
    }
  }

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('Delete this company drive?')) return
    try {
      const response = await fetch(`${API_BASE}/api/companies/${companyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      })
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error || 'Unable to delete company.')
      }
      setCompanies((prev) => prev.filter((c) => c._id !== companyId))
    } catch (err) {
      alert(err.message || 'Unable to delete company.')
    }
  }

  const handleSaveMyStatus = async (companyId) => {
    if (!user?.token || user?.role === 'admin') return
    try {
      const draft = statusDrafts[companyId] || {
        status: 'Not Applied',
        currentRound: '',
        notes: ''
      }
      const response = await fetch(`${API_BASE}/api/company-applications/${companyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(draft)
      })
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error || 'Unable to update status.')
      }
      setApplicationMap((prev) => ({ ...prev, [companyId]: json }))
      alert('Application status updated.')
      if (selectedCompany && selectedCompany._id === companyId) {
        openAnalytics(selectedCompany)
      }
    } catch (err) {
      alert(err.message || 'Unable to update status.')
    }
  }

  const openAnalytics = async (company) => {
    if (!user?.token) return
    setSelectedCompany(company)
    setAnalytics(null)
    setAnalyticsError('')
    setAnalyticsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/companies/${company._id}/analytics`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      })
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error || 'Unable to fetch analytics.')
      }
      setAnalytics(json)
    } catch (err) {
      setAnalyticsError(err.message || 'Unable to fetch analytics.')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const previewEligibility = async (companyId) => {
    try {
      setEligibilityLoading(true)
      const response = await fetch(`${API_BASE}/api/companies/${companyId}/eligibility`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      })
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error || 'Unable to preview eligibility.')
      }
      setEligibilityPreview(json)
      setCompanies((prev) =>
        prev.map((c) =>
          c._id === companyId
            ? { ...c, autoEligibleRollNos: (json.eligibleStudents || []).map((s) => s.Rollno) }
            : c
        )
      )
    } catch (err) {
      alert(err.message || 'Unable to preview eligibility.')
    } finally {
      setEligibilityLoading(false)
    }
  }

  const totalShortlistedAcrossCompanies = useMemo(
    () =>
      companies.reduce((sum, company) => sum + (company.shortlistedRollNos?.length || 0), 0),
    [companies]
  )

  const avgPackage = useMemo(() => {
    if (!companies.length) return 0
    const total = companies.reduce((sum, company) => sum + (Number(company.packageLPA) || 0), 0)
    return (total / companies.length).toFixed(2)
  }, [companies])

  const filteredCompanies = useMemo(() => {
    let items = [...companies]

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase()
      items = items.filter(
        (company) =>
          company.companyName?.toLowerCase().includes(q) ||
          company.roleOffered?.toLowerCase().includes(q) ||
          company.location?.toLowerCase().includes(q)
      )
    }

    if (hiringTypeFilter !== 'All') {
      items = items.filter((company) => (company.hiringType || 'Placement') === hiringTypeFilter)
    }

    if (monthFilter !== 'All') {
      items = items.filter((company) => {
        const d = new Date(company.driveDate || company.createdAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        return key === monthFilter
      })
    }

    if (minPackageFilter !== '') {
      const threshold = Number(minPackageFilter)
      items = items.filter((company) => Number(company.packageLPA || 0) >= threshold)
    }

    if (shortlistedOnly && user?.role !== 'admin') {
      items = items.filter((company) => company.isShortlisted)
    }

    if (sortBy === 'packageDesc') {
      items.sort((a, b) => Number(b.packageLPA || 0) - Number(a.packageLPA || 0))
    } else if (sortBy === 'companyAsc') {
      items.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''))
    } else {
      items.sort((a, b) => new Date(b.driveDate || b.createdAt) - new Date(a.driveDate || a.createdAt))
    }

    return items
  }, [companies, searchTerm, hiringTypeFilter, monthFilter, minPackageFilter, shortlistedOnly, sortBy, user?.role])

  const monthOptions = useMemo(() => {
    const set = new Set()
    companies.forEach((company) => {
      const d = new Date(company.driveDate || company.createdAt)
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    })
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => {
        const [y, m] = key.split('-').map(Number)
        return {
          value: key,
          label: new Date(y, m - 1, 1).toLocaleString(undefined, { month: 'short', year: 'numeric' })
        }
      })
  }, [companies])

  const handleExportAnalyticsCsv = () => {
    if (!analytics) return
    const rows = [
      ['Roll No', 'Branch', 'Batch', 'Resume URL'],
      ...((analytics.shortlistedProfiles || []).map((student) => [
        student.Rollno,
        student.Branch,
        student.BatchYear,
        student.ResumeUrl
      ]))
    ]
    downloadCsv(`${analytics.company?.companyName || 'company'}-shortlisted.csv`, rows)
  }

  return (
    <div
      className="tool-page companies-page"
      style={{
        minHeight: '100vh',
        paddingTop: '24px',
        paddingBottom: '40px',
        backgroundImage:
          'linear-gradient(rgba(0,0,0,0.20), rgba(0,0,0,0.20)), url("https://cdn.pixabay.com/photo/2013/01/20/04/53/college-75535_1280.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="container tool-page-content">
        <div className="d-flex justify-content-between align-items-center mb-3 text-white">
          <h3 className="mb-0 fw-bold">Company Drives</h3>
          <span className="badge bg-light text-dark">Total: {companies.length}</span>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <p className="text-muted mb-1">Drives Posted</p>
                <h4 className="mb-0">{companies.length}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <p className="text-muted mb-1">Average Package</p>
                <h4 className="mb-0">{avgPackage} LPA</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <p className="text-muted mb-1">Shortlisted Slots</p>
                <h4 className="mb-0">{totalShortlistedAcrossCompanies}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <p className="text-muted mb-1">My Active Applications</p>
                <h4 className="mb-0">
                  {user?.role === 'admin'
                    ? '-'
                    : Object.values(applicationMap).filter((a) => a.status !== 'Not Applied').length}
                </h4>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-2">
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Search company / role / location"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <select
                  className="form-select"
                  value={hiringTypeFilter}
                  onChange={(e) => setHiringTypeFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Placement">Placement</option>
                  <option value="Internship">Internship</option>
                  <option value="Internship + PPO">Internship + PPO</option>
                </select>
              </div>
              <div className="col-md-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  placeholder="Min LPA"
                  value={minPackageFilter}
                  onChange={(e) => setMinPackageFilter(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="driveDateDesc">Latest Drive Date</option>
                  <option value="packageDesc">Highest Package</option>
                  <option value="companyAsc">Company A-Z</option>
                </select>
              </div>
              <div className="col-md-1">
                <select
                  className="form-select"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                >
                  <option value="All">All Months</option>
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-1 d-flex align-items-center">
                {user?.role !== 'admin' && (
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={shortlistedOnly}
                      onChange={(e) => setShortlistedOnly(e.target.checked)}
                      id="shortlistedOnly"
                    />
                    <label className="form-check-label" htmlFor="shortlistedOnly">
                      Shortlisted only
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="container tool-page-content">
          <div className="card shadow-sm mb-4 border-0">
            <div className="card-body">
              <h5 className="card-title">Add New Company Drive</h5>
              <form onSubmit={handleCreateCompany}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <input
                      className="form-control"
                      placeholder="Company name"
                      value={form.companyName}
                      onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      className="form-control"
                      placeholder="Role offered"
                      value={form.roleOffered}
                      onChange={(e) => setForm((prev) => ({ ...prev, roleOffered: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={form.hiringType}
                      onChange={(e) => setForm((prev) => ({ ...prev, hiringType: e.target.value }))}
                    >
                      <option value="Placement">Placement</option>
                      <option value="Internship">Internship</option>
                      <option value="Internship + PPO">Internship + PPO</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control"
                      placeholder="Package (LPA)"
                      value={form.packageLPA}
                      onChange={(e) => setForm((prev) => ({ ...prev, packageLPA: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="form-control"
                      placeholder="Openings"
                      value={form.openings}
                      onChange={(e) => setForm((prev) => ({ ...prev, openings: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control"
                      placeholder="Min CGPA"
                      value={form.minCgpa}
                      onChange={(e) => setForm((prev) => ({ ...prev, minCgpa: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      className="form-control"
                      placeholder="Eligible branches (comma-separated)"
                      value={form.eligibleBranchesInput}
                      onChange={(e) => setForm((prev) => ({ ...prev, eligibleBranchesInput: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      className="form-control"
                      placeholder="Eligible batch years (comma-separated)"
                      value={form.eligibleBatchYearsInput}
                      onChange={(e) => setForm((prev) => ({ ...prev, eligibleBatchYearsInput: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      className="form-control"
                      placeholder="Required skills (comma-separated)"
                      value={form.requiredSkillsInput}
                      onChange={(e) => setForm((prev) => ({ ...prev, requiredSkillsInput: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      className="form-control"
                      placeholder="Location"
                      value={form.location}
                      onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label mb-1 small text-muted">Drive Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.driveDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, driveDate: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label mb-1 small text-muted">Application Deadline</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.applicationDeadline}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, applicationDeadline: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      className="form-control"
                      placeholder="Eligibility (optional)"
                      value={form.eligibility}
                      onChange={(e) => setForm((prev) => ({ ...prev, eligibility: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      className="form-control"
                      placeholder="Rounds (comma-separated, e.g. OA, Tech, HR)"
                      value={form.roundsInput}
                      onChange={(e) => setForm((prev) => ({ ...prev, roundsInput: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-12">
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Description (optional)"
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-12">
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Shortlisted roll numbers (comma-separated, optional)"
                      value={form.shortlistedRollNosInput}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, shortlistedRollNosInput: e.target.value }))
                      }
                    />
                  </div>
                </div>
                {formError && <div className="alert alert-danger mt-3 mb-0">{formError}</div>}
                <button className="btn btn-primary mt-3">Create Company Drive</button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="container tool-page-content">
        {loading && <p className="text-white">Loading companies...</p>}
        {!loading && error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && filteredCompanies.length === 0 && (
          <div className="alert alert-info">No company drives matched your filters.</div>
        )}

        <div className="row g-3">
          {filteredCompanies.map((company) => {
            const app = applicationMap[company._id]
            const draft = statusDrafts[company._id] || {
              status: app?.status || 'Not Applied',
              currentRound: app?.currentRound || '',
              notes: app?.notes || ''
            }
            const driveDateObj = new Date(company.driveDate)
            const isPastDrive = driveDateObj < getTodayStart()
            return (
              <div key={company._id} className="col-md-6">
                <div
                  className="card h-100 shadow-sm border-0"
                  style={{ cursor: 'pointer' }}
                  onClick={() => openAnalytics(company)}
                >
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start">
                      <h5 className="card-title mb-1">
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-underline text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            openAnalytics(company)
                          }}
                        >
                          {company.companyName}
                        </button>
                      </h5>
                      {user?.role !== 'admin' && (
                        <span className={`badge ${company.isShortlisted ? 'bg-success' : 'bg-secondary'}`}>
                          {company.isShortlisted ? 'Shortlisted' : 'Not Shortlisted'}
                        </span>
                      )}
                    </div>

                    <p className="mb-1"><strong>Role:</strong> {company.roleOffered}</p>
                    <p className="mb-1"><strong>Package:</strong> {company.packageLPA} LPA</p>
                    <p className="mb-1"><strong>Type:</strong> {company.hiringType || 'Placement'}</p>
                    <p className="mb-1"><strong>Location:</strong> {company.location}</p>
                    <p className="mb-1">
                      <strong>Drive Date:</strong> {new Date(company.driveDate).toLocaleDateString()}
                      {isPastDrive && (
                        <span className="badge bg-secondary ms-2">Past Drive</span>
                      )}
                    </p>
                    {company.applicationDeadline && (
                      <p className="mb-1">
                        <strong>Deadline:</strong> {new Date(company.applicationDeadline).toLocaleDateString()}
                      </p>
                    )}
                    {company.eligibility && <p className="mb-1"><strong>Eligibility:</strong> {company.eligibility}</p>}
                    {company.minCgpa !== undefined && company.minCgpa !== null && (
                      <p className="mb-1"><strong>Min CGPA:</strong> {company.minCgpa}</p>
                    )}
                    {company.eligibleBranches?.length > 0 && (
                      <p className="mb-1"><strong>Eligible Branches:</strong> {company.eligibleBranches.join(', ')}</p>
                    )}
                    {company.eligibleBatchYears?.length > 0 && (
                      <p className="mb-1"><strong>Eligible Batch:</strong> {company.eligibleBatchYears.join(', ')}</p>
                    )}
                    {company.requiredSkills?.length > 0 && (
                      <p className="mb-1"><strong>Required Skills:</strong> {company.requiredSkills.join(', ')}</p>
                    )}
                    {company.openings !== undefined && company.openings !== null && (
                      <p className="mb-1"><strong>Openings:</strong> {company.openings}</p>
                    )}
                    {Array.isArray(company.rounds) && company.rounds.length > 0 && (
                      <p className="mb-1"><strong>Rounds:</strong> {company.rounds.join(' -> ')}</p>
                    )}
                    {company.description && <p className="mb-2"><strong>Details:</strong> {company.description}</p>}

                    <p className="small text-muted mb-2">
                      Created {formatDistanceToNow(new Date(company.createdAt), { addSuffix: true })}
                    </p>

                    <p className="small text-muted mb-2">
                      Applications: {company.totalApplications || 0} | Offers: {company.offerCount || 0}
                    </p>
                    <p className="small text-muted mb-2">
                      Auto-eligible students: {(company.autoEligibleRollNos || []).length}
                    </p>

                    {user?.role === 'admin' ? (
                      <div className="mt-auto">
                        <label className="form-label fw-semibold">Shortlisted Roll Numbers</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={
                            shortlistDrafts[company._id] !== undefined
                              ? shortlistDrafts[company._id]
                              : (company.shortlistedRollNos || []).join(', ')
                          }
                          onChange={(e) =>
                            setShortlistDrafts((prev) => ({ ...prev, [company._id]: e.target.value }))
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="d-flex gap-2 mt-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSaveShortlist(company._id)
                            }}
                            type="button"
                          >
                            Save Shortlist
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCompany(company._id)
                            }}
                            type="button"
                          >
                            Delete
                          </button>
                          <button
                            className="btn btn-sm btn-outline-dark"
                            onClick={(e) => {
                              e.stopPropagation()
                              openAnalytics(company)
                            }}
                            type="button"
                          >
                            View Analytics
                          </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={(e) => {
                            e.stopPropagation()
                            previewEligibility(company._id)
                          }}
                          type="button"
                          disabled={eligibilityLoading}
                        >
                          {eligibilityLoading ? 'Checking...' : 'Preview Eligible'}
                        </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-auto" onClick={isPastDrive ? undefined : (e) => e.stopPropagation()}>
                        {isPastDrive ? (
                          <div className="alert alert-secondary py-2 mb-0">
                            <div className="fw-semibold">Drive completed</div>
                            <div className="small mb-1">This company drive is in the past, so status updates are locked.</div>
                            <div className="small">
                              Final status: <strong>{app?.status || draft.status || 'Not Applied'}</strong>
                            </div>
                          </div>
                        ) : (
                          <>
                            <label className="form-label mb-1 fw-semibold">My Application Status</label>
                            <select
                              className="form-select form-select-sm mb-2"
                              value={draft.status}
                              onChange={(e) =>
                                setStatusDrafts((prev) => ({
                                  ...prev,
                                  [company._id]: { ...draft, status: e.target.value }
                                }))
                              }
                            >
                              {APPLICATION_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <input
                              className="form-control form-control-sm mb-2"
                              placeholder="Current round (optional)"
                              value={draft.currentRound}
                              onChange={(e) =>
                                setStatusDrafts((prev) => ({
                                  ...prev,
                                  [company._id]: { ...draft, currentRound: e.target.value }
                                }))
                              }
                            />
                            <textarea
                              className="form-control form-control-sm mb-2"
                              rows="2"
                              placeholder="Notes (optional)"
                              value={draft.notes}
                              onChange={(e) =>
                                setStatusDrafts((prev) => ({
                                  ...prev,
                                  [company._id]: { ...draft, notes: e.target.value }
                                }))
                              }
                            />
                            <button
                              className="btn btn-sm btn-primary"
                              type="button"
                              onClick={() => handleSaveMyStatus(company._id)}
                            >
                              Save My Status
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {selectedCompany && (
          <>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(2, 6, 23, 0.66)',
                zIndex: 1090
              }}
              onClick={() => setSelectedCompany(null)}
            />
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(1100px, 94vw)',
                maxHeight: '86vh',
                overflowY: 'auto',
                zIndex: 1100
              }}
            >
              <div className="card shadow border-0">
                <div className="card-body" onClick={(e) => e.stopPropagation()}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Analytics: {selectedCompany.companyName}</h5>
                <div className="d-flex gap-2">
                  {analytics && (
                    <button className="btn btn-sm btn-outline-primary" onClick={handleExportAnalyticsCsv}>
                      Export Shortlist CSV
                    </button>
                  )}
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedCompany(null)}>
                    Close
                  </button>
                </div>
              </div>

              {analyticsLoading && <p className="mb-0">Loading analytics...</p>}
              {!analyticsLoading && analyticsError && (
                <div className="alert alert-danger mb-0">{analyticsError}</div>
              )}

              {!analyticsLoading && !analyticsError && analytics && (
                <>
                  {new Date(selectedCompany.driveDate) < getTodayStart() && (
                    <div className="mb-3 border rounded p-3" style={{ background: 'rgba(2, 6, 23, 0.28)' }}>
                      <h6 className="mb-1">Drive Completed: Final Offered Students</h6>
                      <p className="small text-muted mb-0">
                        This company drive is completed. Below are the students who received final offers.
                      </p>
                    </div>
                  )}

                  <div className="row g-3 mb-3">
                    <div className="col-md-2">
                      <div
                        className="p-3 rounded"
                        style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148,163,184,0.28)' }}
                      >
                        <p className="mb-1" style={{ color: '#cdd9ee' }}>Portal Students</p>
                        <h5 className="mb-0" style={{ color: '#f8fbff' }}>{analytics.totalStudentsInPortal}</h5>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div
                        className="p-3 rounded"
                        style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148,163,184,0.28)' }}
                      >
                        <p className="mb-1" style={{ color: '#cdd9ee' }}>Shortlisted</p>
                        <h5 className="mb-0" style={{ color: '#f8fbff' }}>{analytics.shortlistedCount}</h5>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div
                        className="p-3 rounded"
                        style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148,163,184,0.28)' }}
                      >
                        <p className="mb-1" style={{ color: '#cdd9ee' }}>Profiles Found</p>
                        <h5 className="mb-0" style={{ color: '#f8fbff' }}>{analytics.profileMatchedCount}</h5>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div
                        className="p-3 rounded"
                        style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148,163,184,0.28)' }}
                      >
                        <p className="mb-1" style={{ color: '#cdd9ee' }}>Shortlist Rate</p>
                        <h5 className="mb-0" style={{ color: '#f8fbff' }}>{analytics.shortlistRate}%</h5>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div
                        className="p-3 rounded"
                        style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148,163,184,0.28)' }}
                      >
                        <p className="mb-1" style={{ color: '#cdd9ee' }}>Applications</p>
                        <h5 className="mb-0" style={{ color: '#f8fbff' }}>{analytics.totalApplications || 0}</h5>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div
                        className="p-3 rounded"
                        style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148,163,184,0.28)' }}
                      >
                        <p className="mb-1" style={{ color: '#cdd9ee' }}>Offers</p>
                        <h5 className="mb-0" style={{ color: '#f8fbff' }}>{analytics.applicationStatusBreakdown?.Offer || 0}</h5>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h6>Final Offered Students</h6>
                    {analytics.offeredProfiles?.length ? (
                      <div className="table-responsive">
                        <table className="table table-sm table-striped align-middle">
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Roll No</th>
                              <th>Branch</th>
                              <th>Batch</th>
                              <th>CGPA</th>
                              <th>Round</th>
                              <th>Resume</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.offeredProfiles.map((student) => (
                              <tr key={`${student.userId}-${student.rollNo}`}>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <img
                                      src={student.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.fullName || student.rollNo || 'Student')}`}
                                      alt={student.fullName || student.rollNo || 'Student'}
                                      style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                    <span>{student.fullName || '-'}</span>
                                  </div>
                                </td>
                                <td>{student.rollNo || '-'}</td>
                                <td>{student.branch || '-'}</td>
                                <td>{student.batchYear || '-'}</td>
                                <td>{student.cgpa ?? '-'}</td>
                                <td>{student.currentRound || '-'}</td>
                                <td>
                                  {student.resumeUrl ? (
                                    <a href={student.resumeUrl} target="_blank" rel="noreferrer">
                                      {student.resumeFileName || 'View'}
                                    </a>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted mb-0">No final offers released yet for this drive.</p>
                    )}
                  </div>

                  <div className="mt-3">
                    <h6>Shortlisted Students</h6>
                    {analytics.shortlistedProfiles?.length ? (
                      <div className="table-responsive">
                        <table className="table table-sm table-striped">
                          <thead>
                            <tr>
                              <th>Roll No</th>
                              <th>Branch</th>
                              <th>Batch</th>
                              <th>Resume</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.shortlistedProfiles.map((student) => (
                              <tr key={student._id}>
                                <td>{student.Rollno}</td>
                                <td>{student.Branch}</td>
                                <td>{student.BatchYear}</td>
                                <td>
                                  <a href={student.ResumeUrl} target="_blank" rel="noreferrer">
                                    View
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted mb-0">No matched student profiles found.</p>
                    )}
                  </div>

                  {analytics.missingRollNos?.length > 0 && (
                    <div className="alert alert-warning mt-3 mb-0">
                      <strong>Roll numbers not found in student profiles:</strong>{' '}
                      {analytics.missingRollNos.join(', ')}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
            </div>
          </>
        )}

        {eligibilityPreview && (
          <div className="card shadow border-0 mt-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Eligibility Preview</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setEligibilityPreview(null)}>
                  Close
                </button>
              </div>
              <p className="mb-2">
                <strong>Eligible Count:</strong> {eligibilityPreview.eligibleCount}
              </p>
              <div className="small text-muted mb-2">
                Criteria: CGPA {eligibilityPreview.criteria?.minCgpa ?? 'Any'} | Branches {eligibilityPreview.criteria?.eligibleBranches?.join(', ') || 'Any'} | Batch {eligibilityPreview.criteria?.eligibleBatchYears?.join(', ') || 'Any'} | Skills {eligibilityPreview.criteria?.requiredSkills?.join(', ') || 'Any'}
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Branch</th>
                      <th>Batch</th>
                      <th>CGPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(eligibilityPreview.eligibleStudents || []).map((s) => (
                      <tr key={s._id}>
                        <td>{s.Rollno}</td>
                        <td>{s.Branch}</td>
                        <td>{s.BatchYear}</td>
                        <td>{s.Cgpa ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Companies

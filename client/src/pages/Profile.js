import { useEffect, useMemo, useState } from 'react'
import { useDatasContext } from '../hooks/useDatasContext'
import { useAuthContext } from '../hooks/useAuthContext'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000'

const BRANCH_OPTIONS = [
  'Computer Science and Business',
  'Computer Science',
  'Information Technology',
  'Computer Science and Artificial Intelligence',
  'M.Tech in Computer Science'
]

const toBranchShort = (branch = '') => {
  if (branch === 'Computer Science') return 'CS'
  if (branch === 'Computer Science and Artificial Intelligence') return 'CSAI'
  if (branch === 'Information Technology') return 'IT'
  if (branch === 'Computer Science and Business') return 'CSB'
  return branch
}

const Profile = () => {
  const { datas, dispatch } = useDatasContext()
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [overview, setOverview] = useState({
    myStats: { appliedCompanies: 0, oaCleared: 0, interviewCleared: 0, offers: 0 },
    myBatch: null,
    myBranch: null,
    myClassStats: null,
    branchBatchStats: []
  })

  const [rollno, setRollno] = useState('')
  const [fullName, setFullName] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [batchYear, setBatchYear] = useState('2021')
  const [branch, setBranch] = useState(BRANCH_OPTIONS[0])
  const [cgpa, setCgpa] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumePreviewUrl, setResumePreviewUrl] = useState('')
  const [selectedStatBranch, setSelectedStatBranch] = useState('Computer Science')

  useEffect(() => {
    const load = async () => {
      if (!user?.token || user.role === 'admin') return
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/api/data`, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Unable to load profile.')
        dispatch({ type: 'SET_DATAS', payload: Array.isArray(json) ? json : [] })
      } catch (e) {
        setError(e.message || 'Unable to load profile.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dispatch, user?.token, user?.role])

  useEffect(() => {
    const loadOverview = async () => {
      if (!user?.token || user.role === 'admin') return
      try {
        const res = await fetch(`${API_BASE}/api/data/profile/overview`, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Unable to load profile stats.')
        setOverview({
          myStats: json.myStats || { appliedCompanies: 0, oaCleared: 0, interviewCleared: 0, offers: 0 },
          myBatch: json.myBatch ?? null,
          myBranch: json.myBranch ?? null,
          myClassStats: json.myClassStats ?? null,
          branchBatchStats: Array.isArray(json.branchBatchStats) ? json.branchBatchStats : []
        })
      } catch (e) {
        // keep page usable even if analytics are temporarily unavailable
      }
    }
    loadOverview()
  }, [user?.token, user?.role])

  const profile = useMemo(() => (Array.isArray(datas) && datas.length ? datas[0] : null), [datas])

  useEffect(() => {
    if (!profile) return
    setFullName(profile.FullName || '')
    setPhotoUrl(profile.PhotoUrl || '')
    setRollno(profile.Rollno || '')
    setBatchYear(String(profile.BatchYear || '2021'))
    setBranch(profile.Branch || BRANCH_OPTIONS[0])
    setCgpa(profile.Cgpa === undefined || profile.Cgpa === null ? '' : String(profile.Cgpa))
  }, [profile])

  useEffect(() => {
    if (!resumeFile) {
      setResumePreviewUrl('')
      return
    }
    const objectUrl = URL.createObjectURL(resumeFile)
    setResumePreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [resumeFile])

  useEffect(() => {
    if (!overview.myBranch) return
    setSelectedStatBranch(overview.myBranch)
  }, [overview.myBranch])

  const refreshProfile = async () => {
    const res = await fetch(`${API_BASE}/api/data`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Unable to refresh profile.')
    dispatch({ type: 'SET_DATAS', payload: Array.isArray(json) ? json : [] })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.token || user.role === 'admin') return

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const body = new FormData()
      body.append('FullName', fullName)
      body.append('PhotoUrl', photoUrl)
      body.append('Rollno', rollno)
      body.append('BatchYear', batchYear)
      body.append('Branch', branch)
      body.append('Cgpa', cgpa)
      if (resumeFile) body.append('ResumeFile', resumeFile)

      const isUpdate = Boolean(profile?._id)
      const res = await fetch(`${API_BASE}/api/data${isUpdate ? `/${profile._id}` : ''}`, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
        body
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Unable to save profile.')

      await refreshProfile()
      const overviewRes = await fetch(`${API_BASE}/api/data/profile/overview`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      const overviewJson = await overviewRes.json()
      if (overviewRes.ok) {
        setOverview({
          myStats: overviewJson.myStats || { appliedCompanies: 0, oaCleared: 0, interviewCleared: 0, offers: 0 },
          myBatch: overviewJson.myBatch ?? null,
          myBranch: overviewJson.myBranch ?? null,
          myClassStats: overviewJson.myClassStats ?? null,
          branchBatchStats: Array.isArray(overviewJson.branchBatchStats) ? overviewJson.branchBatchStats : []
        })
      }
      setResumeFile(null)
      setResumePreviewUrl('')
      setSuccess(isUpdate ? 'Profile updated successfully.' : 'Profile created successfully.')
    } catch (e) {
      setError(e.message || 'Unable to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (user?.role === 'admin') {
    return (
      <div className="tool-page">
        <div className="container py-4 tool-page-content">
          <div className="alert alert-info mb-0">Admin accounts do not have student profile pages.</div>
        </div>
      </div>
    )
  }

  const resumeUrl = profile?.ResumeSignedUrl || profile?.ResumeUrl || profile?.ResumeLink
  const displayName = profile?.FullName || fullName || profile?.Rollno || user?.email || 'Candidate'
  const avatarSrc = profile?.PhotoUrl
    || photoUrl
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`
  const selectedBranchStats = overview.branchBatchStats.find((item) => item.branch === selectedStatBranch) || null

  return (
    <div className="tool-page">
      <div className="container py-4 tool-page-content">
        <div className="d-flex justify-content-between align-items-center mb-3 text-white">
          <div>
            <h3 className="mb-1">My Profile</h3>
            <p className="text-light mb-0">Manage your placement profile and resume in one place.</p>
          </div>
          {profile?.createdAt && (
            <span className="badge bg-light text-dark">
              Updated {formatDistanceToNow(new Date(profile.updatedAt || profile.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>

        {loading && <div className="alert alert-info">Loading profile...</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!loading && (
          <div className="row g-3 mb-3">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-1">Applied Companies</p>
                  <h4 className="mb-0">{overview.myStats.appliedCompanies || 0}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-1">OA Cleared</p>
                  <h4 className="mb-0">{overview.myStats.oaCleared || 0}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-1">Interviews Cleared</p>
                  <h4 className="mb-0">{overview.myStats.interviewCleared || 0}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-1">Offers</p>
                  <h4 className="mb-0">{overview.myStats.offers || 0}</h4>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <div className="row g-3">
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <img
                      src={avatarSrc}
                      alt="student profile"
                      style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e7eefb' }}
                    />
                    <div>
                      <h5 className="mb-0">{displayName}</h5>
                      <small className="text-muted">{profile?.Rollno || '-'}</small>
                    </div>
                  </div>
                  <h5 className="card-title">Candidate Details</h5>
                  <p className="mb-1"><strong>Name:</strong> {profile?.FullName || '-'}</p>
                  <p className="mb-1"><strong>Roll No:</strong> {profile?.Rollno || '-'}</p>
                  <p className="mb-1"><strong>Batch Year:</strong> {profile?.BatchYear || '-'}</p>
                  <p className="mb-1"><strong>Branch:</strong> {profile?.Branch || '-'}</p>
                  <p className="mb-2"><strong>CGPA:</strong> {profile?.Cgpa ?? '-'}</p>
                  <p className="mb-1"><strong>Resume:</strong></p>
                  {resumeUrl ? (
                    <a href={resumeUrl} target="_blank" rel="noreferrer">
                      {profile?.ResumeFileName || 'View Resume'}
                    </a>
                  ) : (
                    <p className="text-muted mb-0">No resume uploaded yet.</p>
                  )}

                  {profile?.ResumeAnalysis?.profile?.skills?.length > 0 && (
                    <>
                      <p className="mb-1 mt-3"><strong>Extracted Skills</strong></p>
                      <div className="d-flex flex-wrap gap-1">
                        {profile.ResumeAnalysis.profile.skills.slice(0, 12).map((skill) => (
                          <span key={skill} className="badge bg-primary">{skill}</span>
                        ))}
                      </div>
                    </>
                  )}

                  {overview.myClassStats && (
                    <div
                      className="mt-3 p-3 rounded"
                      style={{
                        background: 'rgba(15, 23, 42, 0.86)',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        color: '#e6edf6'
                      }}
                    >
                      <p className="mb-1" style={{ color: '#f5f8ff' }}>
                        <strong>My Class ({toBranchShort(overview.myClassStats.branch)} Batch {overview.myClassStats.batchYear})</strong>
                      </p>
                      <p className="mb-1 small" style={{ color: '#d7e2f5' }}>
                        Out of {overview.myClassStats.totalStudents}, placed: {overview.myClassStats.placedStudents}
                      </p>
                      <p className="mb-1 small" style={{ color: '#d7e2f5' }}>
                        Left: {overview.myClassStats.leftStudents} | Placement Rate: {overview.myClassStats.placementRate}%
                      </p>
                      <p className="mb-0 small" style={{ color: '#d7e2f5' }}>
                        Top offer: {overview.myClassStats.topOfferLpa || 0} LPA
                        {overview.myClassStats.topOfferRollNo ? ` (${overview.myClassStats.topOfferRollNo})` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{profile ? 'Update Profile' : 'Create Profile'}</h5>
                  <form onSubmit={handleSubmit}>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <label className="form-label">Full Name</label>
                        <input
                          className="form-control"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Photo URL</label>
                        <input
                          className="form-control"
                          value={photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Roll No</label>
                        <input
                          className="form-control"
                          value={rollno}
                          onChange={(e) => setRollno(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Batch Year</label>
                        <input
                          type="number"
                          min="2018"
                          max="2035"
                          className="form-control"
                          value={batchYear}
                          onChange={(e) => setBatchYear(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Branch</label>
                        <select className="form-select" value={branch} onChange={(e) => setBranch(e.target.value)}>
                          {BRANCH_OPTIONS.map((item) => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">CGPA</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          className="form-control"
                          value={cgpa}
                          onChange={(e) => setCgpa(e.target.value)}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">
                          {profile ? 'Upload New Resume (optional)' : 'Resume PDF'}
                        </label>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="form-control"
                          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                          required={!profile}
                        />
                      </div>
                    </div>
                    <button className="btn btn-primary mt-3" disabled={saving}>
                      {saving ? 'Saving...' : profile ? 'Save Changes' : 'Create Profile'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && overview.branchBatchStats.length > 0 && (
          <div className="card border-0 shadow-sm mt-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <h5 className="mb-0">See Your Batch Results</h5>
                <span className="badge bg-dark">
                  Batch {overview.myBatch || '-'} | Branch {toBranchShort(overview.myBranch || '')}
                </span>
              </div>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {[
                  'Computer Science',
                  'Computer Science and Artificial Intelligence',
                  'Information Technology',
                  'Computer Science and Business'
                ].map((branchName) => (
                  <button
                    key={branchName}
                    type="button"
                    className={`btn btn-sm ${selectedStatBranch === branchName ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedStatBranch(branchName)}
                  >
                    {toBranchShort(branchName)}
                  </button>
                ))}
              </div>

              {selectedBranchStats ? (
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="p-3 rounded border h-100">
                      <p className="text-muted mb-1">Total Students</p>
                      <h5 className="mb-0">{selectedBranchStats.totalStudents}</h5>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 rounded border h-100">
                      <p className="text-muted mb-1">Placed</p>
                      <h5 className="mb-0">{selectedBranchStats.placedStudents}</h5>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 rounded border h-100">
                      <p className="text-muted mb-1">Left</p>
                      <h5 className="mb-0">{selectedBranchStats.leftStudents}</h5>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 rounded border h-100">
                      <p className="text-muted mb-1">Placement Rate</p>
                      <h5 className="mb-0">{selectedBranchStats.placementRate}%</h5>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="p-3 rounded border">
                      <p className="mb-1"><strong>Top Offer:</strong> {selectedBranchStats.topOfferLpa || 0} LPA {selectedBranchStats.topOfferCompany ? `(${selectedBranchStats.topOfferCompany})` : ''}</p>
                      <p className="mb-0"><strong>Top Candidate:</strong> {selectedBranchStats.topOfferStudentName || '-'} {selectedBranchStats.topOfferRollNo ? `(${selectedBranchStats.topOfferRollNo})` : ''}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted mb-0">No data for selected branch.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {resumePreviewUrl && (
        <div
          className="card border-0 shadow"
          style={{
            position: 'fixed',
            right: '18px',
            bottom: '18px',
            width: '280px',
            zIndex: 1100
          }}
        >
          <div className="card-body p-2">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong className="small">Resume Preview</strong>
              <button
                className="btn btn-sm btn-outline-secondary py-0 px-2"
                type="button"
                onClick={() => {
                  setResumeFile(null)
                  setResumePreviewUrl('')
                }}
              >
                x
              </button>
            </div>
            <iframe
              src={resumePreviewUrl}
              title="Selected resume preview"
              style={{ width: '100%', height: '220px', border: '1px solid rgba(148,163,184,0.35)', borderRadius: '8px' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile

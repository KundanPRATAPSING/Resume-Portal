import { useState } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'

const API_BASE = 'http://localhost:4000'

const AIAssistant = () => {
  const { user } = useAuthContext()
  const [mode, setMode] = useState('stored')
  const [resumeFile, setResumeFile] = useState(null)
  const [jdText, setJdText] = useState('')
  const [atsReport, setAtsReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const callJsonApi = async (url, body) => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify(body)
    })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || 'Something went wrong')
    return json
  }

  const handleAtsCheck = async () => {
    try {
      setError('')
      setLoading(true)
      setAtsReport(null)

      if (mode === 'stored') {
        const json = await callJsonApi('/api/ai-assistant/ats-check', { jdText })
        setAtsReport(json.report)
      } else {
        if (!resumeFile) throw new Error('Please upload a resume PDF.')
        const formData = new FormData()
        formData.append('resume', resumeFile)
        formData.append('jdText', jdText)
        const response = await fetch(`${API_BASE}/api/ai-assistant/ats-check-upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.token}`
          },
          body: formData
        })
        const json = await response.json()
        if (!response.ok) throw new Error(json.error || 'Unable to run ATS check.')
        setAtsReport(json.report)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tool-page">
      <div className="container py-4 tool-page-content">
      <h3 className="mb-3 text-white">ATS Resume Checker</h3>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <h5 className="mb-2">Resume Source</h5>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              className={`btn btn-sm ${mode === 'stored' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setMode('stored')}
            >
              Use My Uploaded Resume
            </button>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'upload' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setMode('upload')}
            >
              Upload Another Resume
            </button>
          </div>

          {mode === 'upload' && (
            <div className="mb-3">
              <label className="form-label">Upload Resume (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                className="form-control"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />
            </div>
          )}

          <label className="form-label">Job Description (optional but recommended for ATS match)</label>
          <textarea
            className="form-control mb-2"
            rows="5"
            placeholder="Paste the job description here to check ATS keyword alignment..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
          />
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-primary btn-sm" onClick={handleAtsCheck} disabled={loading}>
              {loading ? 'Checking...' : 'Run ATS Check'}
            </button>
          </div>
        </div>
      </div>

      {atsReport && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <h5 className="mb-0">ATS Score: {atsReport.overallScore}/100</h5>
              <span className={`badge ${atsReport.overallScore >= 80 ? 'bg-success' : atsReport.overallScore >= 65 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                {atsReport.verdict}
              </span>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default AIAssistant

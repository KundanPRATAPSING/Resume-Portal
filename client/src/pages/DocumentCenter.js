import { useEffect, useState } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'

const API_BASE = 'http://localhost:4000'

const DocumentCenter = () => {
  const { user } = useAuthContext()
  const [docs, setDocs] = useState([])
  const [error, setError] = useState('')
  const [docType, setDocType] = useState('Resume')
  const [visibility, setVisibility] = useState('Admin')
  const [file, setFile] = useState(null)

  const loadDocs = async () => {
    if (!user?.token) return
    const response = await fetch(`${API_BASE}/api/documents`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
    const json = await response.json()
    if (response.ok) setDocs(Array.isArray(json) ? json : (json.items || []))
  }

  useEffect(() => {
    loadDocs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token])

  const uploadDoc = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file.')
      return
    }
    setError('')
    const formData = new FormData()
    formData.append('document', file)
    formData.append('docType', docType)
    formData.append('visibility', visibility)

    const response = await fetch(`${API_BASE}/api/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user.token}` },
      body: formData
    })
    const json = await response.json()
    if (!response.ok) {
      setError(json.error || 'Unable to upload document.')
      return
    }
    setFile(null)
    await loadDocs()
  }

  const deleteDoc = async (id) => {
    const response = await fetch(`${API_BASE}/api/documents/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user.token}` }
    })
    if (response.ok) {
      loadDocs()
    }
  }

  return (
    <div className="tool-page">
      <div className="container py-4 tool-page-content">
      <h3 className="mb-3 text-white">Document Center</h3>
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <h5 className="mb-3">Upload New Document Version</h5>
          <form onSubmit={uploadDoc}>
            <div className="row g-2">
              <div className="col-md-3">
                <select className="form-select" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  <option>Resume</option>
                  <option>SOP</option>
                  <option>Marksheet</option>
                  <option>Offer Letter</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <option>Admin</option>
                  <option>Private</option>
                </select>
              </div>
              <div className="col-md-4">
                <input
                  type="file"
                  className="form-control"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary w-100">Upload</button>
              </div>
            </div>
          </form>
          {error && <div className="alert alert-danger mt-2 mb-0">{error}</div>}
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">My Document Library</h5>
          {docs.length === 0 ? (
            <p className="text-muted mb-0">No documents uploaded yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Version</th>
                    <th>Name</th>
                    <th>Visibility</th>
                    <th>Uploaded</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr key={doc._id}>
                      <td>{doc.docType}</td>
                      <td>v{doc.version}</td>
                      <td>
                        <a href={doc.signedUrl || doc.fileUrl} target="_blank" rel="noreferrer">{doc.fileName}</a>
                      </td>
                      <td>{doc.visibility}</td>
                      <td>{new Date(doc.createdAt).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteDoc(doc._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

export default DocumentCenter

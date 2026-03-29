import { useEffect, useMemo, useState } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'

const API_BASE = 'http://localhost:4000'

const InterviewSlots = () => {
  const { user } = useAuthContext()
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [slots, setSlots] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    slotStart: '',
    slotEnd: '',
    location: 'Virtual',
    capacity: 1
  })

  const selectedCompany = useMemo(
    () => companies.find((c) => c._id === selectedCompanyId),
    [companies, selectedCompanyId]
  )

  const fetchCompanies = async () => {
    if (!user?.token) return
    const response = await fetch(`${API_BASE}/api/companies`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
    const json = await response.json()
    if (response.ok) {
      const list = Array.isArray(json) ? json : (json.items || [])
      setCompanies(list)
      if (!selectedCompanyId && list[0]) setSelectedCompanyId(list[0]._id)
    }
  }

  const fetchSlots = async (companyId) => {
    if (!companyId || !user?.token) return
    const response = await fetch(`${API_BASE}/api/interview-slots/company/${companyId}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
    const json = await response.json()
    if (response.ok) setSlots(json)
  }

  useEffect(() => {
    fetchCompanies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token])

  useEffect(() => {
    fetchSlots(selectedCompanyId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, user?.token])

  const createSlot = async (e) => {
    e.preventDefault()
    setError('')
    const response = await fetch(`${API_BASE}/api/interview-slots/company/${selectedCompanyId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify(form)
    })
    const json = await response.json()
    if (!response.ok) {
      setError(json.error || 'Unable to create slot.')
      return
    }
    setForm({
      title: '',
      slotStart: '',
      slotEnd: '',
      location: 'Virtual',
      capacity: 1
    })
    fetchSlots(selectedCompanyId)
  }

  const bookSlot = async (slotId, unbook = false) => {
    setError('')
    const response = await fetch(`${API_BASE}/api/interview-slots/${slotId}/${unbook ? 'unbook' : 'book'}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user.token}` }
    })
    const json = await response.json()
    if (!response.ok) {
      setError(json.error || 'Unable to update slot booking.')
      return
    }
    fetchSlots(selectedCompanyId)
  }

  return (
    <div className="tool-page">
      <div className="container py-4 tool-page-content">
      <h3 className="mb-3 text-white">Interview Slot Booking</h3>
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <label className="form-label">Select Company</label>
          <select
            className="form-select"
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
          >
            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.companyName} - {c.roleOffered}
              </option>
            ))}
          </select>
        </div>
      </div>

      {user?.role === 'admin' && selectedCompanyId && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <h5 className="mb-3">Create Slot Matrix Entry</h5>
            <form onSubmit={createSlot}>
              <div className="row g-2">
                <div className="col-md-4">
                  <input
                    className="form-control"
                    placeholder="Slot title"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="col-md-3">
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={form.slotStart}
                    onChange={(e) => setForm((p) => ({ ...p, slotStart: e.target.value }))}
                  />
                </div>
                <div className="col-md-3">
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={form.slotEnd}
                    onChange={(e) => setForm((p) => ({ ...p, slotEnd: e.target.value }))}
                  />
                </div>
                <div className="col-md-2">
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={form.capacity}
                    onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
                  />
                </div>
                <div className="col-md-6">
                  <input
                    className="form-control"
                    placeholder="Location / meeting link"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  />
                </div>
                <div className="col-md-6">
                  <button className="btn btn-primary w-100">Create Slot</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">
            Schedule Matrix {selectedCompany ? `- ${selectedCompany.companyName}` : ''}
          </h5>
          {slots.length === 0 ? (
            <p className="text-muted mb-0">No slots yet for this company.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Location</th>
                    <th>Filled</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => {
                    const isBooked = slot.bookedUsers?.includes(user._id)
                    const filled = slot.bookedUsers?.length || 0
                    const isFull = filled >= slot.capacity
                    return (
                      <tr key={slot._id}>
                        <td>{slot.title}</td>
                        <td>{new Date(slot.slotStart).toLocaleString()}</td>
                        <td>{new Date(slot.slotEnd).toLocaleString()}</td>
                        <td>{slot.location}</td>
                        <td>{filled}/{slot.capacity}</td>
                        <td>
                          {user.role === 'admin' ? (
                            <span className="badge bg-secondary">Admin view</span>
                          ) : isBooked ? (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => bookSlot(slot._id, true)}>
                              Cancel
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => bookSlot(slot._id)}
                              disabled={isFull}
                            >
                              {isFull ? 'Full' : 'Book'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
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

export default InterviewSlots

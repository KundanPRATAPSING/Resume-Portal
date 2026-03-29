import { useEffect, useState } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'

const API_BASE = 'http://localhost:4000'

const OfferComparison = () => {
  const { user } = useAuthContext()
  const [offers, setOffers] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [comparison, setComparison] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    companyName: '',
    roleType: 'SDE',
    location: '',
    baseSalaryLPA: '',
    joiningBonusLPA: '',
    variablePayLPA: '',
    stockLPA: '',
    perksLPA: '',
    growthScore: 5,
    notes: ''
  })

  const load = async () => {
    const response = await fetch(`${API_BASE}/api/offers`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
    const json = await response.json()
    if (!response.ok) {
      setError(json.error || 'Unable to fetch offers')
      return
    }
    setOffers(json)
  }

  useEffect(() => {
    if (user?.token) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const response = await fetch(`${API_BASE}/api/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify({
        ...form,
        baseSalaryLPA: Number(form.baseSalaryLPA || 0),
        joiningBonusLPA: Number(form.joiningBonusLPA || 0),
        variablePayLPA: Number(form.variablePayLPA || 0),
        stockLPA: Number(form.stockLPA || 0),
        perksLPA: Number(form.perksLPA || 0),
        growthScore: Number(form.growthScore || 5)
      })
    })
    const json = await response.json()
    if (!response.ok) {
      setError(json.error || 'Unable to save offer')
      return
    }
    setOffers((prev) => [json, ...prev])
    setForm({
      companyName: '',
      roleType: 'SDE',
      location: '',
      baseSalaryLPA: '',
      joiningBonusLPA: '',
      variablePayLPA: '',
      stockLPA: '',
      perksLPA: '',
      growthScore: 5,
      notes: ''
    })
  }

  const runCompare = async () => {
    setError('')
    const response = await fetch(`${API_BASE}/api/offers/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify({ offerIds: selectedIds })
    })
    const json = await response.json()
    if (!response.ok) {
      setError(json.error || 'Unable to compare offers')
      return
    }
    setComparison(json)
  }

  const toggle = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="tool-page">
      <div className="container py-4 tool-page-content">
      <h3 className="mb-3 text-white">Offer Comparison Tool</h3>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <h5 className="mb-3">Add Offer</h5>
          <form onSubmit={submit}>
            <div className="row g-2">
              <div className="col-md-3">
                <input className="form-control" placeholder="Company" value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} />
              </div>
              <div className="col-md-2">
                <select className="form-select" value={form.roleType} onChange={(e) => setForm((p) => ({ ...p, roleType: e.target.value }))}>
                  <option>SDE</option>
                  <option>Analyst</option>
                  <option>Product</option>
                  <option>Data</option>
                  <option>Core</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="col-md-2">
                <input className="form-control" placeholder="Location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="col-md-1"><input type="number" className="form-control" placeholder="Base" value={form.baseSalaryLPA} onChange={(e) => setForm((p) => ({ ...p, baseSalaryLPA: e.target.value }))} /></div>
              <div className="col-md-1"><input type="number" className="form-control" placeholder="Bonus" value={form.joiningBonusLPA} onChange={(e) => setForm((p) => ({ ...p, joiningBonusLPA: e.target.value }))} /></div>
              <div className="col-md-1"><input type="number" className="form-control" placeholder="Var" value={form.variablePayLPA} onChange={(e) => setForm((p) => ({ ...p, variablePayLPA: e.target.value }))} /></div>
              <div className="col-md-1"><input type="number" className="form-control" placeholder="Stock" value={form.stockLPA} onChange={(e) => setForm((p) => ({ ...p, stockLPA: e.target.value }))} /></div>
              <div className="col-md-1"><input type="number" className="form-control" placeholder="Perks" value={form.perksLPA} onChange={(e) => setForm((p) => ({ ...p, perksLPA: e.target.value }))} /></div>
              <div className="col-md-2"><input type="number" min="1" max="10" className="form-control" placeholder="Growth 1-10" value={form.growthScore} onChange={(e) => setForm((p) => ({ ...p, growthScore: e.target.value }))} /></div>
              <div className="col-md-8"><input className="form-control" placeholder="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></div>
              <div className="col-md-4"><button className="btn btn-primary w-100">Save Offer</button></div>
            </div>
          </form>
          {error && <div className="alert alert-danger mt-2 mb-0">{error}</div>}
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">My Offers</h5>
            <button className="btn btn-success btn-sm" onClick={runCompare}>Compare Selected</button>
          </div>
          <div className="table-responsive">
            <table className="table table-sm table-striped">
              <thead>
                <tr>
                  <th></th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Total CTC (LPA)</th>
                  <th>Growth</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((o) => (
                  <tr key={o._id}>
                    <td><input type="checkbox" checked={selectedIds.includes(o._id)} onChange={() => toggle(o._id)} /></td>
                    <td>{o.companyName}</td>
                    <td>{o.roleType}</td>
                    <td>{o.location}</td>
                    <td>{o.totalCtcLPA}</td>
                    <td>{o.growthScore}/10</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {comparison && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="mb-2">Comparison Result</h5>
            <p className="mb-2"><strong>Recommended:</strong> {comparison.winner.companyName} ({comparison.winner.weightedScore})</p>
            <div className="table-responsive">
              <table className="table table-sm table-striped mb-0">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Company</th>
                    <th>Total CTC</th>
                    <th>Growth</th>
                    <th>Weighted Score</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.ranked.map((row, idx) => (
                    <tr key={row._id}>
                      <td>#{idx + 1}</td>
                      <td>{row.companyName}</td>
                      <td>{row.totalCtcLPA}</td>
                      <td>{row.growthScore}</td>
                      <td>{row.weightedScore}</td>
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

export default OfferComparison

import React, { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import "../index.css";

const API_BASE_CANDIDATES = [
  process.env.REACT_APP_API_URL,
  "http://localhost:4000",
  "http://localhost:4001",
  ""
].filter(Boolean);

const apiFetch = async (path, options = {}) => {
  let lastError = null;
  for (const base of API_BASE_CANDIDATES) {
    try {
      return await fetch(`${base}${path}`, options);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("Failed to fetch");
};

const palette = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316", "#0ea5e9"];

const SvgBarChart = ({ data = [] }) => {
  const width = 820;
  const height = 280;
  const padding = { top: 20, right: 16, bottom: 56, left: 48 };
  const max = Math.max(...data.map((d) => Number(d.offers || 0)), 1);
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const barW = data.length ? innerW / data.length : innerW;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 320 }}>
      <line x1={padding.left} y1={padding.top + innerH} x2={width - padding.right} y2={padding.top + innerH} stroke="#64748b" />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#64748b" />
      {data.map((d, i) => {
        const value = Number(d.offers || 0);
        const h = (value / max) * innerH;
        const x = padding.left + i * barW + barW * 0.12;
        const y = padding.top + innerH - h;
        const w = barW * 0.76;
        return (
          <g key={d.branch}>
            <rect x={x} y={y} width={w} height={h} fill={palette[i % palette.length]} rx="4" />
            <text x={x + w / 2} y={y - 6} textAnchor="middle" fontSize="11" fill="#dbeafe">{value}</text>
            <text x={x + w / 2} y={padding.top + innerH + 14} textAnchor="middle" fontSize="10" fill="#cbd5e1">
              {String(d.branch).length > 12 ? `${String(d.branch).slice(0, 12)}...` : d.branch}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const SvgDonutChart = ({ data = [] }) => {
  const total = Math.max(data.reduce((sum, x) => sum + Number(x.offers || 0), 0), 1);
  const cx = 90;
  const cy = 90;
  const r = 58;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="d-flex flex-wrap align-items-center gap-3">
      <svg viewBox="0 0 180 180" width="180" height="180">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="18" />
        {data.map((d, i) => {
          const value = Number(d.offers || 0);
          const frac = value / total;
          const seg = frac * c;
          const piece = (
            <circle
              key={d.branch}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={palette[i % palette.length]}
              strokeWidth="18"
              strokeDasharray={`${seg} ${c - seg}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="butt"
            />
          );
          offset += seg;
          return piece;
        })}
        <text x="90" y="86" textAnchor="middle" fontSize="13" fill="#dbeafe">Total</text>
        <text x="90" y="104" textAnchor="middle" fontSize="16" fill="#ffffff" fontWeight="600">{total}</text>
      </svg>
      <div>
        {data.map((d, i) => (
          <div key={d.branch} className="small mb-1" style={{ color: "#dbeafe" }}>
            <span style={{ display: "inline-block", width: 10, height: 10, background: palette[i % palette.length], borderRadius: 2, marginRight: 8 }} />
            {d.branch}: {d.offers}
          </div>
        ))}
      </div>
    </div>
  );
};

const SvgLineChart = ({ data = [] }) => {
  const width = 900;
  const height = 270;
  const padding = { top: 18, right: 18, bottom: 48, left: 42 };
  const max = Math.max(...data.map((d) => Number(d.avgPackage || 0)), 1);
  const min = 0;
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * innerW);
    const y = padding.top + (1 - (Number(d.avgPackage || 0) - min) / (max - min || 1)) * innerH;
    return { ...d, x, y };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 300 }}>
      <line x1={padding.left} y1={padding.top + innerH} x2={width - padding.right} y2={padding.top + innerH} stroke="#64748b" />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#64748b" />
      <path d={path} fill="none" stroke="#22d3ee" strokeWidth="3" />
      {points.map((p) => (
        <g key={p.month}>
          <circle cx={p.x} cy={p.y} r="4" fill="#22d3ee" />
          <text x={p.x} y={padding.top + innerH + 14} textAnchor="middle" fontSize="10" fill="#cbd5e1">{p.month}</text>
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fill="#dbeafe">{p.avgPackage}</text>
        </g>
      ))}
    </svg>
  );
};

const PlacementStats = () => {
  const { user } = useAuthContext();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [branchView, setBranchView] = useState("bar");
  const [trendView, setTrendView] = useState("line");
  const [selectedBatch, setSelectedBatch] = useState("all");

  useEffect(() => {
    const load = async () => {
      if (!user?.token) return;
      setLoading(true);
      setError("");
      try {
        const response = await apiFetch(`/api/insights/placement`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Unable to load insights.");
        setData(json);
      } catch (e) {
        setError(e.message || "Unable to load insights.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.token]);

  const batchOptions = useMemo(() => {
    const list = (data?.batchWiseOffers || []).map((x) => String(x.batchYear));
    return [...new Set(list)].sort();
  }, [data]);

  const selectedBranchData = useMemo(() => {
    if (!data) return [];
    if (selectedBatch === "all") return data.branchWiseOffers || [];
    const matrix = data.batchBranchMatrix?.[selectedBatch] || {};
    return Object.entries(matrix).map(([branch, offers]) => ({ branch, offers }));
  }, [data, selectedBatch]);

  return (
    <div className="tool-page">
      <div className="container py-4 tool-page-content">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h2 className="fw-bold mb-0 text-white">Placement Insights Dashboard</h2>
          <div className="d-flex gap-2">
            <select className="form-select form-select-sm" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
              <option value="all">All Batches</option>
              {batchOptions.map((b) => (
                <option key={b} value={b}>Batch {b}</option>
              ))}
            </select>
          </div>
        </div>
        {loading && <p>Loading insights...</p>}
        {error && <div className="alert alert-danger">{error}</div>}
        {!loading && !error && data && (
          <>
            <div className="row text-center mb-4 g-3">
              <div className="col-md-4 mb-3">
                <div className="stat-box" style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(148,163,184,0.28)" }}>
                  <h5>Total Companies</h5>
                  <p>{data.totals.totalCompanies}</p>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="stat-box" style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(148,163,184,0.28)" }}>
                  <h5>Offers</h5>
                  <p>{data.totals.offerCount}</p>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="stat-box" style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(148,163,184,0.28)" }}>
                  <h5>Conversion Rate</h5>
                  <p>{data.totals.conversionRate}%</p>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <div className="stat-box" style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(148,163,184,0.28)" }}>
                  <h5>Highest Package</h5>
                  <p>{data.totals.highestPackage} LPA</p>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <div className="stat-box" style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(148,163,184,0.28)" }}>
                  <h5>Average Package</h5>
                  <p>{data.totals.avgPackage} LPA</p>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <h5 className="fw-bold mb-0">Branch-wise Categorisation</h5>
                  <div className="btn-group btn-group-sm">
                    <button className={`btn ${branchView === "bar" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setBranchView("bar")}>Bar</button>
                    <button className={`btn ${branchView === "donut" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setBranchView("donut")}>Donut</button>
                    <button className={`btn ${branchView === "table" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setBranchView("table")}>Table</button>
                  </div>
                </div>

                {branchView === "bar" && (
                  <div className="mb-2"><SvgBarChart data={selectedBranchData} /></div>
                )}

                {branchView === "donut" && (
                  <SvgDonutChart data={selectedBranchData} />
                )}

                {branchView === "table" && (
                  <div className="table-responsive">
                    <table className="table table-sm table-striped">
                      <thead>
                        <tr>
                          <th>Branch</th>
                          <th>Offers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBranchData.map((item) => (
                          <tr key={item.branch}>
                            <td>{item.branch}</td>
                            <td>{item.offers}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Top Recruiters</h5>
                <div className="d-flex flex-wrap gap-2">
                  {data.topRecruiters?.map((company) => (
                    <span className="badge bg-primary fs-6 px-3 py-2" key={company.companyName}>
                      {company.companyName} ({company.maxPackage} LPA)
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <h5 className="fw-bold mb-0">Average Package Trend</h5>
                  <div className="btn-group btn-group-sm">
                    <button className={`btn ${trendView === "line" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTrendView("line")}>Line</button>
                    <button className={`btn ${trendView === "table" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTrendView("table")}>Table</button>
                  </div>
                </div>
                {trendView === "line" && (
                  <SvgLineChart data={data.packageTrend || []} />
                )}
                {trendView === "table" && (
                  <div className="table-responsive">
                    <table className="table table-striped table-sm">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Avg Package (LPA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.packageTrend?.map((row) => (
                          <tr key={row.month}>
                            <td>{row.month}</td>
                            <td>{row.avgPackage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlacementStats;

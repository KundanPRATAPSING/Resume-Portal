import { useAuthContext } from "../hooks/useAuthContext";
import { useState } from "react";

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
    } catch (e) {
      lastError = e
    }
  }
  throw lastError || new Error('Failed to fetch')
}

const Notification = ({ onCreated }) => {
  const { user } = useAuthContext();
  const [title, settitle] = useState("");
  const [description, setBatchYear] = useState("");
  const [targetRolesInput, setTargetRolesInput] = useState("");
  const [targetBranchesInput, setTargetBranchesInput] = useState("");
  const [targetBatchYearsInput, setTargetBatchYearsInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parseStringList = (input) =>
    input.split(',').map((x) => x.trim()).filter(Boolean);
  const parseNumberList = (input) =>
    input.split(',').map((x) => Number(x.trim())).filter((x) => !Number.isNaN(x));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("You must be logged in.");
      return;
    }

    const data = {
      title,
      description,
      targetRoles: parseStringList(targetRolesInput),
      targetBranches: parseStringList(targetBranchesInput),
      targetBatchYears: parseNumberList(targetBatchYearsInput),
    };

    setSubmitting(true);
    try {
      const response = await apiFetch("/api/notifications/create", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || "Unable to create notification.");
      } else {
        settitle("");
        setBatchYear("");
        setTargetRolesInput("");
        setTargetBranchesInput("");
        setTargetBatchYearsInput("");
        setSuccess("Notification published successfully.");
        if (onCreated) onCreated();
      }
    } catch (e2) {
      setError(e2.message || "Unable to create notification.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <h5 className="mb-1">Create Notification</h5>
        <p className="text-muted mb-3 small">Use targeting fields to send announcements by role, branch or batch.</p>
        <form onSubmit={handleSubmit}>
          <div className="row g-2">
            <div className="col-md-6">
              <input
                className="form-control"
                type="text"
                placeholder="Title"
                value={title}
                required
                onChange={(e) => settitle(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <input
                className="form-control"
                type="text"
                placeholder="Target Roles (optional: user,admin)"
                value={targetRolesInput}
                onChange={(e) => setTargetRolesInput(e.target.value)}
              />
            </div>
            <div className="col-12">
              <textarea
                className="form-control"
                placeholder="Description"
                required
                rows="3"
                value={description}
                onChange={(e) => setBatchYear(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <input
                className="form-control"
                type="text"
                placeholder="Target Branches (optional)"
                value={targetBranchesInput}
                onChange={(e) => setTargetBranchesInput(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <input
                className="form-control"
                type="text"
                placeholder="Target Batch Years (optional: 2021,2022)"
                value={targetBatchYearsInput}
                onChange={(e) => setTargetBatchYearsInput(e.target.value)}
              />
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Publishing..." : "Publish Notification"}
            </button>
          </div>
          {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
          {success && <div className="alert alert-success mt-3 mb-0">{success}</div>}
        </form>
      </div>
    </div>
  );
};

export default Notification;

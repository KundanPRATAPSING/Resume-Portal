import { useState } from "react";
import { useDatasContext } from "../hooks/useDatasContext";
import { useAuthContext } from '../hooks/useAuthContext';

const DataForm = ({setHasPreviousData}) => {
  const { dispatch } = useDatasContext();
  const { user } = useAuthContext();

  const [Rollno, setRollno] = useState('');
  const [BatchYear, setBatchYear] = useState('2021');
  const [Branch, setBranch] = useState('Computer Science and Business');
  const [ResumeFile, setResumeFile] = useState(null);
  const [DriveLinkUrl, setDriveLinkUrl] = useState('');
  const [error, setError] = useState(null);
  const [emptyFields, setEmptyFields] = useState([]);

  const API_BASE = process.env.REACT_APP_API_URL || '';
  /* ── no parse state ── */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in');
      return;
    }

    const formData = new FormData();
    formData.append('Rollno', Rollno);
    formData.append('BatchYear', BatchYear);
    formData.append('Branch', Branch);
    if (DriveLinkUrl) {
      formData.append('DriveLinkUrl', DriveLinkUrl);
    }
    if (ResumeFile) {
      formData.append('ResumeFile', ResumeFile);
    }

    const existingDatasResponse = await fetch(`${API_BASE}/api/data`, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
    const existingDatas = await existingDatasResponse.json();
    console.log("Existing datas ",existingDatas);

    if (existingDatas.length > 0) {
      setError('Resume has already been uploaded. Delete it to upload a new one.');
      return;
    }

    const response = await fetch(`${API_BASE}/api/data`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (!response.ok) {
      setError(json.error);
      setEmptyFields(json.emptyFields || []);
    } else {
      setRollno('');
      setBatchYear('2021');
      setBranch('Computer Science and Business');
      setResumeFile(null);
      setDriveLinkUrl('');
      setError(null);
      setEmptyFields([]);
      dispatch({ type: 'CREATE_DATA', payload: json });
      setHasPreviousData(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="dashboard-page container-fluid d-flex justify-content-center align-items-center"
    style={{
      minHeight: '100vh',
      backgroundImage: 'url("https://img.freepik.com/premium-photo/university-campus-with-big-field-photography-students-are-waking-gossiping-their-campus-free_551880-7836.jpg?w=1380")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>

      <div className="row shadow-lg rounded-4 overflow-hidden bg-white w-75" style={{ maxWidth: '950px',
          marginTop: '80px',
       }}>
        
        {/* Left Panel with Background Image */}
        <div className="col-md-5 p-0">
          <div
            style={{
              height: '100%',
              backgroundImage: `url("https://img.freepik.com/free-photo/front-view-woman-catching-graduation-cap-education-day_23-2149241037.jpg?t=st=1743851883~exp=1743855483~hmac=c7c0847d3873c1eb049105bc572c301de777ccbbf0416f9360c20b84378668ef&w=740")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                // backgroundColor: 'rgba(91, 33, 182, 0.7)',
                color: 'white',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                borderTopLeftRadius: '20px',
                borderBottomLeftRadius: '20px',
              }}
            >
              {/* <h4 className="fw-bold">IIIT Lucknow</h4>
              <p className="mb-1">Submit your resume link and academic info</p>
              <p className="mb-0">Portal by Placement Cell</p> */}
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="col-md-7 p-5">
          <h4 className="text-center fw-bold mb-4">Resume Upload</h4>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">IIIT-Lucknow Roll No</label>
              <input
                type="text"
                placeholder="e.g. LCB2021003"
                className={`form-control ${emptyFields.includes('Rollno') ? 'is-invalid' : ''}`}
                value={Rollno}
                onChange={(e) => setRollno(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Batch Year</label>
              <select
                className="form-select"
                value={BatchYear}
                onChange={(e) => setBatchYear(e.target.value)}
              >
                <option value="2021">2025</option>
                <option value="2020">2026</option>
                <option value="2020">2027</option>
                <option value="2020">2028</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Branch</label>
              <select
                className="form-select"
                value={Branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                <option value="Computer Science and Business">Computer Science and Business</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Computer Science and Artificial Intelligence">Computer Science and AI</option>
                <option value="M.Tech in Computer Science">M.Tech in Computer Science</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Resume PDF</label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className={`form-control ${emptyFields.includes('ResumeFile') ? 'is-invalid' : ''}`}
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />
              <small className="form-text text-muted">
                Upload only PDF (max 5MB). You can create one from <a href="https://www.overleaf.com/latex/templates/software-engineer-resume/gqxmqsvsbdjf" target="_blank" rel="noreferrer">this template</a>.
              </small>
            </div>

            {/* Google Drive Link */}
            <div className="mb-3">
              <label className="form-label">Google Drive Resume Link <span className="text-muted fw-normal">(optional)</span></label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                className="form-control"
                value={DriveLinkUrl}
                onChange={(e) => setDriveLinkUrl(e.target.value)}
              />
              <small className="form-text text-muted">
                Paste a publicly viewable Google Drive link to your resume.
              </small>
            </div>

            <button className="btn btn-primary w-100" disabled={false}>
              Add Details
            </button>

            {error && <div className="alert alert-danger text-center mt-3">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default DataForm;

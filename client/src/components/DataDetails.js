import { useDatasContext } from '../hooks/useDatasContext';
import { useAuthContext } from '../hooks/useAuthContext';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

const DataDetails = ({ data,setHasPreviousData }) => {
  const { dispatch } = useDatasContext();
  const { user } = useAuthContext();
  const resumeUrl = data.ResumeSignedUrl || data.ResumeUrl || data.ResumeLink;
  const fileLabel = data.ResumeFileName || 'View Resume';

  const handleClick = async () => {
    if (!user) {
      return;
    }

    const response = await fetch('http://localhost:4000/api/data/' + data._id, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      dispatch({ type: 'DELETE_DATA', payload: json });
      if (setHasPreviousData) {
        setHasPreviousData(false);
      }
    }
  };

  if (user?.role === 'admin') {
    return (
      <div className="admin-resume-card">
        <h5 className="mb-3">Student Details</h5>
        <p><strong>Roll No:</strong> {data.Rollno}</p>
        <p><strong>Batch Year:</strong> {data.BatchYear}</p>
        <p><strong>Branch:</strong> {data.Branch}</p>
        {data.Cgpa !== undefined && data.Cgpa !== null && <p><strong>CGPA:</strong> {data.Cgpa}</p>}
        {data.ResumeAnalysis?.profile?.skills?.length > 0 && (
          <p><strong>Skills:</strong> {data.ResumeAnalysis.profile.skills.slice(0, 8).join(', ')}</p>
        )}
        <p className="mb-3">
          <strong>Resume:</strong>{' '}
          <a href={resumeUrl} target="_blank" rel="noreferrer">
            {fileLabel}
          </a>
        </p>
        <button className="btn btn-danger btn-sm w-100" onClick={handleClick}>
          Delete
        </button>
      </div>
    );
  }

  return (
    <div
      className="dashboard-page container-fluid d-flex justify-content-center align-items-center"
    >
      <div
        className="row shadow-lg rounded-4 overflow-hidden bg-white w-75"
        style={{ maxWidth: '950px', marginTop: '80px' }}
      >
        {/* Left Panel with Image */}
        <div className="col-md-5 p-0">
          <div
            style={{
              height: '100%',
              backgroundImage:
                'url("https://img.freepik.com/free-photo/front-view-woman-catching-graduation-cap-education-day_23-2149241037.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>

        {/* Right Panel with Data Details */}
        <div className="col-md-7 p-5">
          <h4 className="text-center fw-bold mb-4">Student Details</h4>
          <div className="mb-3">
            <strong>Roll No:</strong>
            <p>{data.Rollno}</p>
          </div>
          <div className="mb-3">
            <strong>Batch Year:</strong>
            <p>{data.BatchYear}</p>
          </div>
          <div className="mb-3">
            <strong>Branch:</strong>
            <p>{data.Branch}</p>
          </div>
          {(data.Cgpa !== undefined && data.Cgpa !== null) && (
            <div className="mb-3">
              <strong>CGPA:</strong>
              <p>{data.Cgpa}</p>
            </div>
          )}
          <div className="mb-3">
            <strong>Resume File:</strong>
            <p>
              <a href={resumeUrl} target="_blank" rel="noreferrer">
                {fileLabel}
              </a>
            </p>
          </div>
          {data.ResumeAnalysis?.profile?.skills?.length > 0 && (
            <div className="mb-3">
              <strong>Extracted Skills:</strong>
              <p>{data.ResumeAnalysis.profile.skills.join(', ')}</p>
            </div>
          )}
          {(data.ResumeAnalysis?.gapHints?.length > 0) && (
            <div className="mb-3">
              <strong>Improvement Hints:</strong>
              <ul className="mb-0">
                {data.ResumeAnalysis.gapHints.map((hint, idx) => (
                  <li key={idx}>{hint}</li>
                ))}
              </ul>
            </div>
          )}

          {user.role !== 'admin' && (
            <p className="text-muted">
              Uploaded {formatDistanceToNow(new Date(data.createdAt), { addSuffix: true })}
            </p>
          )}

          <button className="btn btn-danger w-100 mt-2" onClick={handleClick}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataDetails;   
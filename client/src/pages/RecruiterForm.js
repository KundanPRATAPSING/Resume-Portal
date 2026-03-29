// // import { useState } from "react";

// // const RecruiterForm = () => {
// //   const [companyName, setCompanyName] = useState("");
// //   const [recruiterName, setRecruiterName] = useState("");
// //   const [roles, setRoles] = useState("");
// //   const [ctc, setCtc] = useState("");
// //   const [intake, setIntake] = useState("");
// //   const [skills, setSkills] = useState("");
// //   const [location, setLocation] = useState("");
// //   const [deadline, setDeadline] = useState("");
// //   const [error, setError] = useState(null);

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     const recruiterDetails = {
// //       companyName,
// //       recruiterName,
// //       roles,
// //       ctc,
// //       intake,
// //       skills,
// //       location,
// //       deadline,
// //     };

// //     const response = await fetch("http://localhost:4000/api/recruiters", {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify(recruiterDetails),
// //     });

// //     const json = await response.json();

// //     if (!response.ok) {
// //       setError(json.error);
// //     } else {
// //       setCompanyName("");
// //       setRecruiterName("");
// //       setRoles("");
// //       setCtc("");
// //       setIntake("");
// //       setSkills("");
// //       setLocation("");
// //       setDeadline("");
// //       setError(null);
// //       alert("Details submitted successfully!");
// //     }
// //   };

// //   return (
// //     <div
// //       className="container-fluid d-flex justify-content-center align-items-center"
// //       style={{
// //         minHeight: "100vh",
// //         backgroundImage:
// //           "url('https://cdn.pixabay.com/photo/2013/01/20/04/53/college-75535_1280.jpg')",
// //         backgroundSize: "cover",
// //         backgroundPosition: "center",
// //         backgroundRepeat: "no-repeat",
// //       }}
// //     >
// //       <div
// //         className="row shadow-lg rounded-4 overflow-hidden bg-white w-75"
// //         style={{ maxWidth: "950px", marginTop: "80px" }}
// //       >
// //         {/* Left Image Panel */}
// //         <div className="col-md-5 p-0">
// //           <div
// //             style={{
// //               height: "100%",
// //               backgroundImage:
           
// //                 "url('https://img.freepik.com/premium-photo/handshake-partnership-business-people-with-deal-collaboration-agreement-shaking-hands-cooperation-employees-with-opportunity-acquisition-b2b-negotiation-congratulations-mockup_590464-188429.jpg?ga=GA1.1.1246861841.1743850324&semt=ais_hybrid&w=740')",
// //               backgroundSize: "cover",
              
// //               backgroundPosition: "center",
// //             }}
// //           ></div>
// //         </div>

// //         {/* Right Form Panel */}
// //         <div className="col-md-7 p-5">
// //           <h4 className="text-center fw-bold mb-4">Recruiter Information</h4>
// //           <form onSubmit={handleSubmit}>
// //             <div className="mb-3">
// //               <label className="form-label">Company Name</label>
// //               <input
// //                 type="text"
// //                 className="form-control"
// //                 value={companyName}
// //                 onChange={(e) => setCompanyName(e.target.value)}
// //               />
// //             </div>
// //             <div className="mb-3">
// //               <label className="form-label">Recruiter Name</label>
// //               <input
// //                 type="text"
// //                 className="form-control"
// //                 value={recruiterName}
// //                 onChange={(e) => setRecruiterName(e.target.value)}
// //               />
// //             </div>
// //             <div className="mb-3">
// //               <label className="form-label">Offered Role(s)</label>
// //               <input
// //                 type="text"
// //                 className="form-control"
// //                 value={roles}
// //                 onChange={(e) => setRoles(e.target.value)}
// //               />
// //             </div>
// //             <div className="mb-3">
// //               <label className="form-label">Offered Package (CTC)</label>
// //               <input
// //                 type="text"
// //                 className="form-control"
// //                 value={ctc}
// //                 onChange={(e) => setCtc(e.target.value)}
// //               />
// //             </div>
// //             <div className="mb-3">
// //               <label className="form-label">Intake (No. of Students)</label>
// //               <input
// //                 type="number"
// //                 className="form-control"
// //                 value={intake}
// //                 onChange={(e) => setIntake(e.target.value)}
// //               />
// //             </div>
// //             <div className="mb-3">
// //               <label className="form-label">Required Skills</label>
// //               <input
// //                 type="text"
// //                 className="form-control"
// //                 value={skills}
// //                 onChange={(e) => setSkills(e.target.value)}
// //               />
// //             </div>
// //             <div className="mb-3">
// //               <label className="form-label">Job Location</label>
// //               <input
// //                 type="text"
// //                 className="form-control"
// //                 value={location}
// //                 onChange={(e) => setLocation(e.target.value)}
// //               />
// //             </div>
// //             <div className="mb-4">
// //               <label className="form-label">Last Date to Apply</label>
// //               <input
// //                 type="date"
// //                 className="form-control"
// //                 value={deadline}
// //                 onChange={(e) => setDeadline(e.target.value)}
// //               />
// //             </div>

// //             <button className="btn btn-primary w-100" type="submit">
// //               Submit Details
// //             </button>

// //             {error && <div className="alert alert-danger mt-3 text-center">{error}</div>}
// //           </form>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default RecruiterForm;

// import { useState } from "react";
// import "../index.css"; // make sure this line exists if not already

// const RecruiterForm = () => {
//   const [companyName, setCompanyName] = useState("");
//   const [recruiterName, setRecruiterName] = useState("");
//   const [roles, setRoles] = useState("");
//   const [ctc, setCtc] = useState("");
//   const [intake, setIntake] = useState("");
//   const [skills, setSkills] = useState("");
//   const [location, setLocation] = useState("");
//   const [deadline, setDeadline] = useState("");
//   const [error, setError] = useState(null);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const recruiterDetails = {
//       companyName,
//       recruiterName,
//       roles,
//       ctc,
//       intake,
//       skills,
//       location,
//       deadline,
//     };

//     const response = await fetch("http://localhost:4000/api/recruiters", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(recruiterDetails),
//     });

//     const json = await response.json();

//     if (!response.ok) {
//       setError(json.error);
//     } else {
//       setCompanyName("");
//       setRecruiterName("");
//       setRoles("");
//       setCtc("");
//       setIntake("");
//       setSkills("");
//       setLocation("");
//       setDeadline("");
//       setError(null);
//       alert("Details submitted successfully!");
//     }
//   };

//   return (
//     <div className="recruiter-bg">
//       <div className="recruiter-card row shadow-lg rounded-4 overflow-hidden bg-white w-75">
//         <div className="recruiter-image col-md-5 p-0"></div>

//         <div className="col-md-7 p-5">
//           <h4 className="text-center fw-bold mb-4">Recruiter Information</h4>
//           <form onSubmit={handleSubmit}>
//             {[
//               ["Company Name", companyName, setCompanyName],
//               ["Recruiter Name", recruiterName, setRecruiterName],
//               ["Offered Role(s)", roles, setRoles],
//               ["Offered Package (CTC)", ctc, setCtc],
//               ["Intake (No. of Students)", intake, setIntake, "number"],
//               ["Required Skills", skills, setSkills],
//               ["Job Location", location, setLocation],
//             ].map(([label, value, setter, type = "text"], idx) => (
//               <div className="mb-3" key={idx}>
//                 <label className="form-label">{label}</label>
//                 <input
//                   type={type}
//                   className="form-control"
//                   value={value}
//                   onChange={(e) => setter(e.target.value)}
//                 />
//               </div>
//             ))}

//             <div className="mb-4">
//               <label className="form-label">Last Date to Apply</label>
//               <input
//                 type="date"
//                 className="form-control"
//                 value={deadline}
//                 onChange={(e) => setDeadline(e.target.value)}
//               />
//             </div>

//             <button className="btn btn-primary w-100" type="submit">
//               Submit Details
//             </button>

//             {error && (
//               <div className="alert alert-danger mt-3 text-center">
//                 {error}
//               </div>
//             )}
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RecruiterForm;


import { useEffect, useState } from "react";
import "../index.css"; // Make sure this is pointing to the correct CSS file

const RecruiterForm = () => {
  const [companyName, setCompanyName] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [roles, setRoles] = useState("");
  const [ctc, setCtc] = useState("");
  const [intake, setIntake] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [email, setEmail] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadList = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/recruiters");
      const json = await response.json();
      if (response.ok) {
        setList(json);
      }
    } catch (e) {
      // keep page usable even if list fetch fails
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const recruiterDetails = {
      companyName,
      recruiterName,
      roles,
      ctc,
      intake,
      skills,
      location,
      deadline,
      email,
    };

    const response = await fetch("http://localhost:4000/api/recruiters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recruiterDetails),
    });

    const json = await response.json();

    if (!response.ok) {
      setError(json.error);
    } else {
      setCompanyName("");
      setRecruiterName("");
      setRoles("");
      setCtc("");
      setIntake("");
      setSkills("");
      setLocation("");
      setDeadline("");
      setEmail("");
      setError(null);
      alert("Details submitted successfully!");
      loadList();
    }
    setLoading(false);
  };

  return (
    <div className="recruiter-bg">
      <div className="recruiter-card row">
        {/* Left Side Image */}
        <div className="recruiter-image col-md-5 p-0"></div>

        {/* Right Side Form */}
        <div className="col-md-7 p-4">
          <h4 className="text-center fw-bold mb-4">Recruiter Information</h4>
          <form onSubmit={handleSubmit}>
            {[ 
              ["Company Name", companyName, setCompanyName],
              ["Recruiter Name", recruiterName, setRecruiterName],
              ["Offered Role(s)", roles, setRoles],
              ["Offered Package (CTC)", ctc, setCtc],
              ["Intake (No. of Students)", intake, setIntake, "number"],
              ["Required Skills", skills, setSkills],
              ["Job Location", location, setLocation],
            ].map(([label, value, setter, type = "text"], idx) => (
              <div className="mb-3" key={idx}>
                <label className="form-label">{label}</label>
                <input
                  type={type}
                  className="form-control"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                />
              </div>
            ))}

            <div className="mb-4">
              <label className="form-label">Last Date to Apply</label>
              <input
                type="date"
                className="form-control"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Recruiter Email (optional)</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Details"}
            </button>

            {error && (
              <div className="alert alert-danger mt-3 text-center">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="container mt-4">
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h5 className="mb-3">Recruiter Submissions</h5>
            {list.length === 0 ? (
              <p className="text-muted mb-0">No submissions yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Roles</th>
                      <th>CTC</th>
                      <th>Intake</th>
                      <th>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((item) => (
                      <tr key={item._id}>
                        <td>{item.companyName}</td>
                        <td>{item.roles}</td>
                        <td>{item.ctc}</td>
                        <td>{item.intake}</td>
                        <td>{new Date(item.deadline).toLocaleDateString()}</td>
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
  );
};

export default RecruiterForm;

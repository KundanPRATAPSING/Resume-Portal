// // import { useState } from "react"
// // import { useLogin } from "../hooks/useLogin"

// // const Login = () => {
// //   const [email, setEmail] = useState('')
// //   const [password, setPassword] = useState('')
// //   const [role,setRole] = useState('user')
// //   const {login, error, isLoading} = useLogin()

// //   const handleSubmit = async (e) => {
// //     e.preventDefault()

// //     await login(email, password,role)
// //   }
// //   return (
// //     <form className="login" onSubmit={handleSubmit}>
// //       <h3>Log In</h3>
      
// //       <label>Email address:</label>
// //       <input 
// //         type="email" 
// //         onChange={(e) => setEmail(e.target.value)} 
// //         value={email} 
// //       />
// //       <label>Password:</label>
// //       <input 
// //         type="password" 
// //         onChange={(e) => setPassword(e.target.value)} 
// //         value={password} 
// //       />
// //       <label>Role:</label>        
// //       <select value={role} onChange={(e)=>setRole(e.target.value)}>
// //         <option value="user">User</option>
// //         <option value="admin">Admin</option>
// //       </select>
// //       <button disabled={isLoading}>Log in</button>
// //       {error && <div className="error">{error}</div>}
// //     </form>
// //   )
// // }
// // export default Login




// import { useState } from "react";
// import { useLogin } from "../hooks/useLogin";

// const Login = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [role, setRole] = useState('user');
//   const { login, error, isLoading } = useLogin();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     await login(email, password, role);
//   };

//   return (
//     <div className="login-page container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', marginTop: '-80px' }}>

//       <div className="row shadow-lg rounded-4 overflow-hidden bg-white w-75" style={{ maxWidth: '900px' }}>
        
//         {/* Left section (Welcome message) */}
//         <div className="col-md-6 bg-primary text-white p-5 d-flex flex-column justify-content-center">
//           <h2 className="fw-bold">WELCOME</h2>
//           <p>journey starts here !, Create your profile, upload your resume, and unlock opportunities waiting just for you.

// </p>
//         </div>

//         {/* Right section (Login form) */}
//         <div className="col-md-6 p-5">
//           <h3 className="mb-4 text-center fw-bold">Log In</h3>
//           <form onSubmit={handleSubmit}>
//             <div className="mb-3">
//               <label className="form-label">Email address</label>
//               <input
//                 type="email"
//                 className="form-control"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />
//             </div>

//             <div className="mb-3">
//               <label className="form-label">Password</label>
//               <input
//                 type="password"
//                 className="form-control"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//               />
//             </div>

//             <div className="mb-4">
//               <label className="form-label">Role</label>
//               <select
//                 className="form-select"
//                 value={role}
//                 onChange={(e) => setRole(e.target.value)}
//               >
//                 <option value="user">User</option>
//                 <option value="admin">Admin</option>
//               </select>
//             </div>

//             <button
//               type="submit"
//               disabled={isLoading}
//               className="btn btn-primary w-100 mb-3"
//             >
//               Log In
//             </button>

//             {error && <div className="alert alert-danger text-center">{error}</div>}
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;


import { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const { login, error, isLoading } = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password, role);
  };

  return (
    <div className="login-page container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', marginTop: '-80px' }}>

      <div className="row shadow-lg rounded-4 overflow-hidden bg-white w-75" style={{ maxWidth: '900px' }}>

        {/* Left section (Welcome message) */}
        <div className="col-md-6 bg-primary text-white p-5 d-flex flex-column justify-content-center">
          <h2 className="fw-bold">WELCOME</h2>
          <p>
            Journey starts here! Create your profile, upload your resume, and unlock opportunities waiting just for you.
          </p>
        </div>

        {/* Right section (Login form) */}
        <div className="col-md-6 p-5">
          <h3 className="mb-4 text-center fw-bold">Log In</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-100 mb-3"
            >
              Log In
            </button>

            {error && <div className="alert alert-danger text-center">{error}</div>}
            <div className="text-center mt-2">
              <Link to="/forgot-password" className="text-decoration-none">
                Forgot password?
              </Link>
            </div>
          </form>

          {/* Recruiter link */}
          <div className="text-center mt-4">
            <small>
              Are you a recruiter?{" "}
              <Link to="/recruiter-login" className="text-decoration-none fw-bold text-primary">
                 login here
              </Link>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

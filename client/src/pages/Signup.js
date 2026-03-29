// import { useState } from "react"
// import { useSignup } from "../hooks/useSignup"

// const Signup = () => {
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const role="user"
//   const {signup, error, isLoading} = useSignup()

//   const handleSubmit = async (e) => {
//     e.preventDefault()
    
//     await signup(email, password,role)
//   }

//   return (
//     <form className="signup" onSubmit={handleSubmit}>
//       <h3>Sign Up</h3>
//       <p className="a">(Use your College id)</p>
//       <label>Email address:</label>
//       <input 
//         type="email" 
//         onChange={(e) => setEmail(e.target.value)} 
//         value={email} 
//       />
//       <label>Password:</label>
//       <input 
//         type="password" 
//         onChange={(e) => setPassword(e.target.value)} 
//         value={password} 
//       />

//       <button disabled={isLoading}>Sign up</button>
//       {error && <div className="error">{error}</div>}
//     </form>
//   )
// }

// export default Signup


import { useState } from "react";
import { useSignup } from "../hooks/useSignup";

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const role = "user";
  const { signup, error, isLoading } = useSignup();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signup(email, password, role);
  };

  return (
    <div className="login-page container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', marginTop: '-80px' }}>
      <div className="row shadow-lg rounded-4 overflow-hidden bg-white w-75" style={{ maxWidth: '900px' }}>
        
        {/* Left Section */}
        <div className="col-md-6 bg-primary text-white p-5 d-flex flex-column justify-content-center">
          <h2 className="fw-bold">GET STARTED!</h2>
          <p>Create your student profile and start your placement journey by uploading your resume.</p>
        </div>

        {/* Right Section (Signup Form) */}
        <div className="col-md-6 p-5">
          <h3 className="mb-3 text-center fw-bold">Sign Up</h3>
          <p className="text-success text-center mb-4 fw-semibold">(Use your College ID)</p>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-control"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                required
              />
            </div>

            <button
              disabled={isLoading}
              className="btn btn-primary w-100"
            >
              Sign Up
            </button>

            {error && <div className="alert alert-danger text-center mt-3">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;



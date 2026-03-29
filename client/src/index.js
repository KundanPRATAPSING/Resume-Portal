import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { DatasContextProvider } from './context/DataContext'
import { AuthContextProvider } from './context/AuthContext'

const root = ReactDOM.createRoot(document.getElementById('root'));

// find element by id ='root' in html and then render whole react into it.


// NOTE: StrictMode runs effects twice in development, which can make the first load feel slow.
// Removing it makes initial renders happen in one pass.
root.render(
  <AuthContextProvider>
    <DatasContextProvider>
      <App />
    </DatasContextProvider>
  </AuthContextProvider>
);



// Index.js file React app ka entrmy point hota hai. Yahan ReactDOM root create karta hai aur App component ko render karta hai.
// Maine app ko 2 context providers me wrap kiya hai — AuthContextProvider for user login info, aur DatasContextProvider for student resume data — taaki ye state poore app me globally accessible ho.
// Bootstrap bhi import kiya hai for consistent UI styling without writing custom CSS.




// 1. index.js
// 2. App.js
// 3. Navbar.js
// 4. Login.js + useLogin.js
// 5. Signup.js + useSignup.js
// 6. AuthContext.js + useAuthContext.js
// 7. DataForm.js + useDatasContext.js
// 8. DataDetails.js
// 9. Notifications (both files)
// 10. Main.js, Footer.js, Home.js

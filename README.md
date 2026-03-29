## Live at @https://iiitl-resume-portal.vercel.app


#   Resume-Portal-For-College


# A MERN Stack Website
## Developed using the MERN stack featuring JWT authentication, which includes MongoDB, Express, React, Node.js, and JSON Web Tokens.

</br>
</br>


# Home page
![CollegePhoto](https://github.com/ANMOLYADAV1402/ResumePortalForCampus/assets/81957738/f17416ce-c9d8-4855-bcac-da39f65063ed)


</br>
</br>

# Login and SignUp
## In the login/logout procedures of this MERN stack project, JWT is employed to authenticate users, generate tokens upon login, and validate tokens to ensure secure access control.
![image](https://github.com/ANMOLYADAV1402/ResumePortalForCampus/assets/81957738/36b3224f-eff6-4807-9e56-ba4434a6705c)
![image](https://github.com/ANMOLYADAV1402/ResumePortalForCampus/assets/81957738/cee99c33-4120-4a9d-805d-82ebfe988d20)



</br>
</br>

# User-Dashboard 
## Effortlessly upload and revise resumes to maximize your opportunities effortlessly.

![DashBoard](https://github.com/ANMOLYADAV1402/ResumePortalForCampus/assets/81957738/7086bbda-16f4-43f1-963b-9b1b04054b92)


</br>
</br>


# User-Notification Section
## Users stay connected through timely notifications from the admin, ensuring seamless communication of career opportunities and updates on student shortlisting and subsequent processes.
![p1](https://github.com/ANMOLYADAV1402/ResumePortalForCampus/assets/81957738/61a5c3e4-fb86-4dfb-8dcf-7efd37e6d936)

</br>
</br>

# Admin Dashboard
## The database owner creates the admin role by modifying permissions.
## The Admin Dashboard allows administrators to view everyone's resumes for the subsequent stages of the placement process.
## Recruiters can utilize it to view and shortlist students.
![AdminDashboard](https://github.com/ANMOLYADAV1402/ResumePortalForCampus/assets/81957738/a6a72072-4706-4569-8f0b-c33da172914d)

</br>
</br>

# Admin Notification Panel
## The platform empowers the admin to send notifications to all students and manage updates, including the ability to delete them.
## Employed to communicate essential updates concerning the company, processes, and the selected list.
![adminnotificationpanel](https://github.com/ANMOLYADAV1402/ResumePortalForCampus/assets/81957738/783d7d97-f2e9-4212-8f54-14114703a9e1)

</br>
</br>

# Mobile View-
![mobile](https://github.com/ANMOLYADAV1402/ResumePortalForCampus/assets/81957738/7dfec581-1661-49f0-8e5f-05254e81e127)
![mobile2](https://github.com/ANMOLYADAV1402/ResumePortalForCampus/assets/81957738/f7077825-012a-480d-85ef-f317c3b34ca9)



# Thank You !

## New: Resume parsing API (dev)
- Endpoint: `POST /api/data/parse`
- Auth: requires the existing JWT auth (same as other data routes).
- Form field: `resume` (PDF, max 5MB).
- Response: structured `profile` (contact, skills, education, experience), `completeness.score` (0-100) and `rawText` for client-side editing.
- Intended flow: upload → prefill an editable profile form → let the user adjust and save.


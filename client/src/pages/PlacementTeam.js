const TEAM = [
  {
    name: "Dr. Ananya Verma",
    role: "Head, Placement Cell",
    email: "placement.head@iiitl.ac.in",
    phone: "+91-90000-10001",
    focus: "Industry outreach, partnerships, final offer governance",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Ananya%20Verma"
  },
  {
    name: "Rahul Srivastava",
    role: "Training & Placement Officer",
    email: "tpo@iiitl.ac.in",
    phone: "+91-90000-10002",
    focus: "Drive scheduling, student readiness, interview coordination",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Rahul%20Srivastava"
  },
  {
    name: "Priya Nair",
    role: "Corporate Relations Manager",
    email: "corporate.relations@iiitl.ac.in",
    phone: "+91-90000-10003",
    focus: "Recruiter onboarding, JD pipeline, engagement communication",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Priya%20Nair"
  },
  {
    name: "Aman Singh",
    role: "Student Placement Coordinator",
    email: "student.coordinator@iiitl.ac.in",
    phone: "+91-90000-10004",
    focus: "Student support desk, notices, resume/profile compliance",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Aman%20Singh"
  }
]

const PlacementTeam = () => {
  return (
    <div className="tool-page">
      <div className="container py-4 tool-page-content">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h3 className="text-white mb-1">Placement Team</h3>
            <p className="text-light mb-0">Meet the team responsible for campus placements and drive operations.</p>
          </div>
          <span className="badge bg-light text-dark">IIIT Lucknow Placement Cell</span>
        </div>

        <div className="row g-3">
          {TEAM.map((member) => (
            <div className="col-md-6 col-lg-4" key={member.email}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      style={{ width: 58, height: 58, borderRadius: "50%", border: "1px solid rgba(148,163,184,0.35)" }}
                    />
                    <div>
                      <h5 className="mb-0">{member.name}</h5>
                      <small className="text-muted">{member.role}</small>
                    </div>
                  </div>
                  <p className="mb-2"><strong>Focus:</strong> {member.focus}</p>
                  <p className="mb-1"><strong>Email:</strong> <a href={`mailto:${member.email}`}>{member.email}</a></p>
                  <p className="mb-0"><strong>Phone:</strong> {member.phone}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card border-0 shadow-sm mt-3">
          <div className="card-body">
            <h5 className="mb-2">What This Team Handles</h5>
            <div className="row g-2">
              <div className="col-md-4"><div className="p-2 rounded border h-100">Company outreach and onboarding</div></div>
              <div className="col-md-4"><div className="p-2 rounded border h-100">Drive calendar and round management</div></div>
              <div className="col-md-4"><div className="p-2 rounded border h-100">Offer release, policy, and reporting</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlacementTeam

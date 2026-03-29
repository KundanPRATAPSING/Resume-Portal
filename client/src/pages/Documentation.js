const Documentation = () => {
  const sheetPath = '/docs/ResumePortal_Interview_Documentation.md'
  const docxPath = '/docs/ResumePortal_Interview_Documentation.docx'

  return (
    <div className="tool-page">
      <div className="container py-4 tool-page-content">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h3 className="mb-2">Project Documentation</h3>
            <p className="text-muted mb-3">
              Download the full interview-format feature documentation sheet. It includes architecture,
              feature-by-feature implementation, logic design, and exact file map references.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <a className="btn btn-primary" href={sheetPath} download>
                Download Full Sheet
              </a>
              <a className="btn btn-success" href={docxPath} download>
                Download DOCX
              </a>
              <a className="btn btn-outline-secondary" href={sheetPath} target="_blank" rel="noreferrer">
                Preview Sheet
              </a>
              <a className="btn btn-outline-success" href={docxPath} target="_blank" rel="noreferrer">
                Open DOCX
              </a>
            </div>
            <hr />
            <h6 className="mb-2">What this sheet contains</h6>
            <ul className="mb-0">
              <li>System architecture and request flow</li>
              <li>All major features with implementation logic</li>
              <li>Backend routes/controllers/models used per feature</li>
              <li>Frontend pages/components/hooks used per feature</li>
              <li>Interview answers, cross-questions and practical talking points</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Documentation

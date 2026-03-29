import { Link } from 'react-router-dom'

const toYoutubeEmbedUrl = (url) => {
  const value = String(url || '')
  const match = value.match(/[?&]v=([^&]+)/)
  if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`
  if (value.includes('youtu.be/')) {
    const parts = value.split('youtu.be/')
    const id = (parts[1] || '').split(/[?&]/)[0]
    if (id) return `https://www.youtube.com/embed/${id}`
  }
  return value
}

const isYoutubeUrl = (url) => /youtube\.com|youtu\.be/.test(String(url || ''))
const getYoutubeId = (url) => {
  const value = String(url || '')
  const fromQuery = value.match(/[?&]v=([^&]+)/)
  if (fromQuery && fromQuery[1]) return fromQuery[1]
  if (value.includes('youtu.be/')) {
    const parts = value.split('youtu.be/')
    return (parts[1] || '').split(/[?&]/)[0]
  }
  return ''
}

const HOME_VIDEOS = [
  {
    title: 'Campus Life',
    desc: 'A quick glimpse of student life and campus energy.',
    src: process.env.REACT_APP_HOME_VIDEO_1 || 'https://www.youtube.com/watch?v=wy4yNkhBQp4&pp=ygUYaWlpdCBsdWNrbm93IGNhbXB1cyB0b3Vy',
    thumbnail: '/images/first-video-thumb.png'
  },
  {
    title: 'IIIT Lucknow Placements Spotlight',
    desc: 'Placement growth highlights, top outcomes, and campus career momentum.',
    src: process.env.REACT_APP_HOME_VIDEO_2 || 'https://www.youtube.com/watch?v=UP3mI-K13ig&pp=ygUYaWlpdCBsdWNrbm93IGNhbXB1cyB0b3Vy'
  },
  {
    title: 'Director’s Vision',
    desc: 'Leadership perspective on institute direction, student growth, and future outcomes.',
    src: process.env.REACT_APP_HOME_VIDEO_3 || 'https://www.youtube.com/watch?v=qatyCaIyalk&pp=ygUVaWlpdCBsdWNrbm93IGRpcmVjdG9y'
  }
]

const Mainpage = () => {
  return (
    <div className="landing-home">
      <section className="landing-hero">
        <div className="landing-overlay" />
        <img
          className="landing-hero-image"
          src="https://cdn.pixabay.com/photo/2021/10/11/04/08/university-6699377_1280.jpg"
          alt="IIIT Lucknow campus"
        />
        <div className="landing-hero-content container">
          <span className="landing-chip">IIIT Lucknow Placement Cell</span>
          <h1>Resume Portal For Campus Placements</h1>
          <p>
            One platform for profile, company drives, timelines, notifications, analytics, and admin control.
          </p>
          <div className="landing-cta-row">
            <Link to="/login" className="btn btn-primary">Login</Link>
            <Link to="/signup" className="btn btn-outline-light">Create Account</Link>
          </div>
        </div>
      </section>

      <section className="landing-section container">
        <div className="landing-section-head">
          <h2>Campus Showcase</h2>
          <p>Your 3 video highlights in a clean production-style layout.</p>
        </div>
        <div className="landing-video-grid">
          {HOME_VIDEOS.map((video) => (
            <article className="landing-video-card" key={video.title}>
              {isYoutubeUrl(video.src) ? (
                <a
                  href={video.src}
                  target="_blank"
                  rel="noreferrer"
                  title={`Watch ${video.title} on YouTube`}
                  style={{ display: 'block', position: 'relative' }}
                >
                  <img
                    src={video.thumbnail || `https://img.youtube.com/vi/${getYoutubeId(video.src)}/hqdefault.jpg`}
                    alt={`${video.title} thumbnail`}
                    style={{
                      width: '100%',
                      minHeight: '190px',
                      objectFit: 'cover',
                      borderRadius: '10px 10px 0 0'
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '10px',
                      bottom: '10px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: '#fff',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '0.8rem'
                    }}
                  >
                    Watch on YouTube
                  </span>
                </a>
              ) : (
                <video controls muted preload="metadata" playsInline>
                  <source src={video.src} type="video/mp4" />
                </video>
              )}
              <div className="landing-video-meta">
                <h5>{video.title}</h5>
                <p>{video.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section container">
        <div className="landing-section-head">
          <h2>How It Works</h2>
        </div>
        <div className="landing-steps">
          <div className="landing-step-card">
            <span>01</span>
            <h6>Create Profile</h6>
            <p>Upload resume, fill details, and keep profile interview-ready.</p>
          </div>
          <div className="landing-step-card">
            <span>02</span>
            <h6>Track Drives</h6>
            <p>Follow deadlines, rounds, shortlists, and status in real time.</p>
          </div>
          <div className="landing-step-card">
            <span>03</span>
            <h6>Convert To Offers</h6>
            <p>Use analytics, timeline and AI prep to improve outcomes.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Mainpage
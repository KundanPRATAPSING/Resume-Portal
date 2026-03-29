const request = require('supertest')
const app = require('../server')

describe('API health and safety', () => {
  test('GET /health/live returns 200', async () => {
    const res = await request(app).get('/health/live')
    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  test('GET /health/ready returns 200 or 503', async () => {
    const res = await request(app).get('/health/ready')
    expect([200, 503]).toContain(res.statusCode)
  })

  test('unknown route returns 404 json', async () => {
    const res = await request(app).get('/api/does-not-exist')
    expect(res.statusCode).toBe(404)
    expect(res.body.error).toBeTruthy()
  })

  test('refresh token endpoint validates payload', async () => {
    const res = await request(app).post('/api/user/refresh-token').send({})
    expect(res.statusCode).toBe(400)
  })
})

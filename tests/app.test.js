const test = require('tap').test
const request = require('supertest')
const app = require('../src/app')

test('GET /contracts/:id with invalid profile', t => {
  request(app)
    .get('/contracts/1')
    .set('profile_id', 0)
    .expect(401)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(Object.keys(res.body), [], 'Response body should be empty')
      t.end()
    })
})

test('GET /contracts/:id with valid profile', t => {
  request(app)
    .get('/contracts/1')
    .set('profile_id', 1)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((error, res) => {
      t.error(error, 'No error')
      t.ok(res.body, 'Response body should exist')
      t.ok(res.body.id, 'Response body should contain the ID')
      t.equal(res.body.id, 1, 'Response body should contain the correct contract ID')
      t.end()
    })
})

test('GET /contracts/:id with valid profile but no matching contract', t => {
  request(app)
    .get('/contracts/1')
    .set('profile_id', 2)
    .expect(404)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(Object.keys(res.body), [], 'Response body should be empty')
      t.end()
    })
})

test('GET /contracts with invalid profile', t => {
  request(app)
    .get('/contracts')
    .expect(401)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(Object.keys(res.body), [], 'Response body should be empty')
      t.end()
    })
})

test('GET /contracts with valid profile', t => {
  request(app)
    .get('/contracts')
    .set('profile_id', 2)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((error, res) => {
      t.error(error, 'No error')
      t.ok(res.body, 'Response body should exist')
      t.ok(Array.isArray(res.body), 'Response body should be an array')
      t.equal(res.body.length, 2, 'Response body should contain one contract')
      t.end()
    })
})

test('GET /contracts with valid profile but no non-terminated contract', t => {
  request(app)
    .get('/contracts')
    .set('profile_id', 5)
    .expect(404)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(Object.keys(res.body), [], 'Response body should be empty')
      t.end()
    })
})

test('GET /jobs/unpaid with invalid profile', t => {
  request(app)
    .get('/jobs/unpaid')
    .expect(401)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(Object.keys(res.body), [], 'Response body should be empty')
      t.end()
    })
})

test('GET /jobs/unpaid with valid profile', t => {
  request(app)
    .get('/jobs/unpaid')
    .set('profile_id', 2)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((error, res) => {
      t.error(error, 'No error')
      t.ok(res.body, 'Response body should exist')
      t.ok(Array.isArray(res.body), 'Response body should be an array')
      t.equal(res.body.length, 3, 'Response body should contain one unpaid job')
      t.end()
    })
})

test('GET /jobs/unpaid with valid profile but no non-terminated contract', t => {
  request(app)
    .get('/jobs/unpaid')
    .set('profile_id', 5)
    .expect(404)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(Object.keys(res.body), [], 'Response body should be empty')
      t.end()
    })
})

test('GET /jobs/unpaid with valid profile but no jobs', t => {
  request(app)
    .get('/jobs/unpaid')
    .set('profile_id', 9)
    .expect(404)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(Object.keys(res.body), [], 'Response body should be empty')
      t.end()
    })
})

test('POST /jobs/:job_id/pay with invalid profile', t => {
  request(app)
    .post('/jobs/3/pay')
    .expect(401)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(Object.keys(res.body), [], 'Response body should be empty')
      t.end()
    })
})

test('POST /jobs/:job_id/pay with valid profile but wrong job', t => {
  request(app)
    .post('/jobs/1/pay')
    .set('profile_id', 2)
    .expect(404)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(Object.keys(res.body), [], 'Response body should be empty')
      t.end()
    })
})

test('POST /jobs/:job_id/pay with insufficient balance', t => {
  request(app)
    .post('/jobs/15/pay')
    .set('profile_id', 2)
    .expect(403)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(res.body, {
        message: 'Insufficient Balance'
      }, 'Response body should contain message')
      t.end()
    })
})

test('POST /jobs/:job_id/pay with successful payment', t => {
  request(app)
    .post('/jobs/3/pay')
    .set('profile_id', 2)
    .expect(200)
    .end((error, res) => {
      t.error(error, 'No error')
      t.ok(res.body, 'Response body should exist')
      t.ok(res.body.id, 'Response body should contain the ID')
      t.ok(res.body.paid, 'Response body should contain the payment status')
      t.equal(res.body.id, 3, 'Response body should contain the correct job ID')
      t.equal(res.body.paid, true, 'Response body should contain the correct job payment status')
      t.end()
    })
})

test('POST /balances/deposit/:userId with invalid userId', t => {
  request(app)
    .post('/balances/deposit/smusali')
    .set('profile_id', 5)
    .expect(400)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(res.body, {
        message: 'Invalid User ID Format'
      }, 'Response body should contain message')
      t.end()
    })
})

test('POST /balances/deposit/:userId with unauthorized access', t => {
  request(app)
    .post('/balances/deposit/1')
    .set('profile_id', 2)
    .expect(401)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(Object.keys(res.body), [], 'Response body should be empty')
      t.end()
    })
})

test('POST /balances/deposit/:userId with contractor access', t => {
  request(app)
    .post('/balances/deposit/5')
    .set('profile_id', 5)
    .expect(403)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(res.body, {
        message: 'Only clients can deposit money'
      }, 'Response body should contain message')
      t.end()
    })
})

test('POST /balances/deposit/:userId with invalid amount', t => {
  request(app)
    .post('/balances/deposit/1')
    .set('profile_id', 1)
    .send({ amount: '0' })
    .expect(400)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(res.body, {
        message: 'Invalid Amount'
      }, 'Response body should contain message')
      t.end()
    })
})

test('POST /balances/deposit/:userId with no contract', t => {
  request(app)
    .post('/balances/deposit/10')
    .set('profile_id', 10)
    .send({ amount: '0' })
    .expect(404)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(Object.keys(res.body), [], 'Response body should be empty')
      t.end()
    })
})

test('POST /balances/deposit/:userId with higher amount', t => {
  request(app)
    .post('/balances/deposit/1')
    .set('profile_id', 1)
    .send({ amount: 125 })
    .expect(403)
    .end((error, res) => {
      t.error(error, 'No error')
      t.ok(res.body, 'Response body should exist')
      t.ok(res.body.message, 'Response body should contain message')
      t.end()
    })
})

test('POST /balances/deposit/:userId with perfect amount', t => {
  request(app)
    .post('/balances/deposit/1')
    .set('profile_id', 1)
    .send({ amount: 100 })
    .expect(200)
    .end((error, res) => {
      t.error(error, 'No error')
      t.ok(res.body, 'Response body should exist')
      t.ok(res.body.balance, 'Response body should contain balance')
      t.end()
    })
})

test('GET /admin/best-profession with unauthorized access', t => {
  request(app)
    .get('/admin/best-profession')
    .set('profile_id', 2)
    .expect(401)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(Object.keys(res.body), [], 'Response body should be empty')
      t.end()
    })
})

test('GET /admin/best-profession with no start date', t => {
  request(app)
    .get('/admin/best-profession')
    .set('profile_id', -1)
    .expect(400)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(res.body, {
        message: 'Start date is absent'
      }, 'Response body should contain message')
      t.end()
    })
})

test('GET /admin/best-profession with invalid start date', t => {
  request(app)
    .get('/admin/best-profession')
    .set('profile_id', -1)
    .query({
      start: 'smusali'
    })
    .expect(400)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(res.body, {
        message: 'Invalid Start Date'
      }, 'Response body should contain message')
      t.end()
    })
})

test('GET /admin/best-profession with no end date', t => {
  request(app)
    .get('/admin/best-profession')
    .set('profile_id', -1)
    .query({
      start: '0'
    })
    .expect(400)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(res.body, {
        message: 'End date is absent'
      }, 'Response body should contain message')
      t.end()
    })
})

test('GET /admin/best-profession with invalid end date', t => {
  request(app)
    .get('/admin/best-profession')
    .set('profile_id', -1)
    .query({
      start: '0',
      end: 'smusali'
    })
    .expect(400)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(res.body, {
        message: 'Invalid End Date'
      }, 'Response body should contain message')
      t.end()
    })
})

test('GET /admin/best-profession with no job', t => {
  request(app)
    .get('/admin/best-profession')
    .set('profile_id', -1)
    .query({
      start: '0',
      end: '1'
    })
    .expect(404)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(Object.keys(res.body), [], 'Response body should be empty')
      t.end()
    })
})

test('GET /admin/best-profession from the beginning', t => {
  request(app)
    .get('/admin/best-profession')
    .set('profile_id', -1)
    .query({
      start: '0',
      end: `${(new Date()).getTime()}`
    })
    .expect(200)
    .end((error, res) => {
      t.error(error, 'No error')
      t.ok(res.body, 'Response body should exist')
      t.ok(res.body.bestProfession, 'Response body should contain bestProfession')
      t.end()
    })
})

test('GET /admin/best-clients with unauthorized access', t => {
  request(app)
    .get('/admin/best-clients')
    .set('profile_id', 2)
    .expect(401)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(Object.keys(res.body), [], 'Response body should be empty')
      t.end()
    })
})

test('GET /admin/best-clients with no start date', t => {
  request(app)
    .get('/admin/best-clients')
    .set('profile_id', -1)
    .expect(400)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(res.body, {
        message: 'Start date is absent'
      }, 'Response body should contain message')
      t.end()
    })
})

test('GET /admin/best-clients with invalid start date', t => {
  request(app)
    .get('/admin/best-clients')
    .set('profile_id', -1)
    .query({
      start: 'smusali'
    })
    .expect(400)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(res.body, {
        message: 'Invalid Start Date'
      }, 'Response body should contain message')
      t.end()
    })
})

test('GET /admin/best-clients with no end date', t => {
  request(app)
    .get('/admin/best-clients')
    .set('profile_id', -1)
    .query({
      start: '0'
    })
    .expect(400)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(res.body, {
        message: 'End date is absent'
      }, 'Response body should contain message')
      t.end()
    })
})

test('GET /admin/best-clients with invalid end date', t => {
  request(app)
    .get('/admin/best-clients')
    .set('profile_id', -1)
    .query({
      start: '0',
      end: 'smusali'
    })
    .expect(400)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(res.body, {
        message: 'Invalid End Date'
      }, 'Response body should contain message')
      t.end()
    })
})

test('GET /admin/best-clients with invalid limit', t => {
  request(app)
    .get('/admin/best-clients')
    .set('profile_id', -1)
    .query({
      limit: 'smusali',
      start: '0',
      end: '2'
    })
    .expect(400)
    .end((error, res) => {
      t.error(error, 'No error')
      t.deepEqual(res.body, {
        message: 'Limit should be >= 0'
      }, 'Response body should contain message')
      t.end()
    })
})

test('GET /admin/best-clients without limit', t => {
  request(app)
    .get('/admin/best-clients')
    .set('profile_id', -1)
    .query({
      start: '0',
      end: `${(new Date()).getTime()}`
    })
    .expect(200)
    .end((error, res) => {
      t.error(error, 'No error')
      t.ok(res.body, 'Response body should exist')
      t.equal(res.body.length, 2, 'Response body should contain 3 items')
      t.end()
    })
})

test('GET /admin/best-clients with a valid limit', t => {
  request(app)
    .get('/admin/best-clients')
    .set('profile_id', -1)
    .query({
      limit: '3',
      start: '0',
      end: `${(new Date()).getTime()}`
    })
    .expect(200)
    .end((error, res) => {
      t.error(error, 'No error')
      t.ok(res.body, 'Response body should exist')
      t.equal(res.body.length, 3, 'Response body should contain 3 items')
      t.end()
    })
})

test('GET /error Error handling', t => {
  request(app)
    .get('/error')
    .expect(500)
    .end((error, res) => {
      t.error(error, 'No error')
      t.ok(res.body, 'Response body should exist')
      t.equal(res.body.error, 'Error', 'Response body should contain Error')
      t.end()
    })
})

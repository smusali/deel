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

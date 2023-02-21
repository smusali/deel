require('express-async-errors')
const express = require('express')
const bodyParser = require('body-parser')
const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const { Op } = require('sequelize')
const app = express()
app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

app.get('/contracts/:id', getProfile, async (req, res) => {
  const { Contract } = req && req.app && req.app.get('models')
  const { id } = req && req.params
  const profileID = req && req.profile && req.profile.id

  const contract = await Contract.findOne({
    where: {
      id,
      [Op.or]: [{
        ClientId: profileID
      }, {
        ContractorId: profileID
      }]
    }
  })

  if (!contract) return res.status(404).end()
  return res.json(contract)
})

app.get('/contracts', getProfile, async (req, res) => {
  const { Contract } = req && req.app && req.app.get('models')
  const profileID = req && req.profile && req.profile.id

  const contracts = await Contract.findAll({
    where: {
      [Op.or]: [{
        ClientId: profileID
      }, {
        ContractorId: profileID
      }],
      status: {
        [Op.not]: 'terminated'
      }
    }
  })

  if (!contracts || contracts.length === 0) return res.status(404).end()
  return res.json(contracts)
})

app.get('/jobs/unpaid', getProfile, async (req, res) => {
  const { Contract, Job } = req && req.app && req.app.get('models')
  const profileID = req && req.profile && req.profile.id

  const contracts = await Contract.findAll({
    where: {
      [Op.or]: [{
        ClientId: profileID
      }, {
        ContractorId: profileID
      }],
      status: {
        [Op.not]: 'terminated'
      }
    },
    include: [{
      model: Job
    }]
  })

  if (!contracts || contracts.length === 0) return res.status(404).end()
  const unpaidJobs = []
  contracts.forEach((contract) => {
    contract.Jobs && contract.Jobs.forEach((job) => {
      if (!job.paid) unpaidJobs.push(job)
    })
  })

  if (unpaidJobs.length === 0) return res.status(404).end()
  return res.json(unpaidJobs)
})

app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
  const { Contract, Job, Profile } = req && req.app && req.app.get('models')
  const jobID = req && req.params && req.params.job_id
  const profile = req && req.profile

  const job = await Job.findOne({
    where: {
      id: jobID,
      '$Contract.ClientId$': profile.id
    },
    include: [{
      model: Contract,
      include: [{
        as: 'Contractor',
        model: Profile
      }]
    }]
  })

  if (!job || job.paid) return res.status(404).end()
  if (!profile.balance || job.price > profile.balance) {
    return res.status(403).json({
      message: 'Insufficient Balance'
    })
  }

  const amount = job.price
  job.Contract.Contractor.balance += amount
  profile.balance += amount

  job.paid = true
  job.paymentDate = new Date()

  await job.save()
  await job.Contract.Contractor.save()
  await profile.save()

  return res.json(job)
})

app.post('/balances/deposit/:userId', getProfile, async (req, res) => {
  const profile = req && req.profile
  const userID = req && req.params && req.params.userId
  if (isNaN(parseInt(userID))) {
    return res.status(400).json({
      message: 'Invalid User ID Format'
    })
  }

  const id = parseInt(userID)
  if (profile.id !== id) return res.status(401).end()
  if (profile.type !== 'client') {
    return res.status(403).json({
      message: 'Only clients can deposit money'
    })
  }

  const { Contract, Job } = req && req.app && req.app.get('models')
  const contracts = await Contract.findAll({
    where: {
      ClientId: id
    },
    include: [{
      model: Job
    }]
  })

  if (!contracts || contracts.length === 0) return res.status(404).end()
  const { amount } = req.body
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      message: 'Invalid Amount'
    })
  }

  let total = 0
  contracts.forEach((contract) => {
    total += contract.Jobs && contract.Jobs.filter(job => !job.paid).reduce((totalPrice, job) => {
      return totalPrice + job.price
    }, 0)
  })

  const maxDeposit = total * 0.25
  if (amount > maxDeposit) {
    return res.status(403).json({
      message: `Can't deposit more than ${maxDeposit.toFixed(2)} at this time`
    })
  }

  profile.balance += amount
  await profile.save()

  return res.json({
    balance: profile.balance
  })
})

app.get('/admin/best-profession', getProfile, async (req, res) => {
  const profile = req && req.profile
  if (profile.id >= 0) return res.status(401).end()

  if (!req.query || !req.query.start) {
    return res.status(400).json({
      message: 'Start date is absent'
    })
  }

  const start = new Date(parseInt(req.query.start))
  if (isNaN(start.getTime())) {
    return res.status(400).json({ message: 'Invalid Start Date' })
  }

  if (!req.query || !req.query.end) {
    return res.status(400).json({
      message: 'End date is absent'
    })
  }

  const end = new Date(parseInt(req.query.end))
  if (isNaN(end.getTime())) {
    return res.status(400).json({ message: 'Invalid End Date' })
  }

  const { Contract, Job, Profile } = req && req.app && req.app.get('models')
  const jobs = await Job.findAll({
    include: {
      model: Contract,
      include: {
        model: Profile,
        as: 'Contractor',
        where: {
          type: 'contractor'
        }
      }
    },
    where: {
      paid: true,
      paymentDate: {
        [Op.between]: [start, end]
      }
    }
  })

  if (!jobs || jobs.length === 0) return res.status(404).end()
  const professions = jobs.reduce((professionsMap, job) => {
    const profession = job.Contract.Contractor.profession
    const price = job.price
    professionsMap[profession] = (professionsMap[profession] || 0) + price

    return professionsMap
  }, {})

  const bestProfession = Object.keys(professions).reduce(
    (a, b) => (professions[a] > professions[b] ? a : b),
    ''
  )

  res.json({
    bestProfession
  })
})

app.get('/admin/best-clients', getProfile, async (req, res) => {
  const profile = req && req.profile
  if (profile.id >= 0) return res.status(401).end()

  if (!req.query || !req.query.start) {
    return res.status(400).json({
      message: 'Start date is absent'
    })
  }

  const start = new Date(parseInt(req.query.start))
  if (isNaN(start.getTime())) {
    return res.status(400).json({ message: 'Invalid Start Date' })
  }

  if (!req.query || !req.query.end) {
    return res.status(400).json({
      message: 'End date is absent'
    })
  }

  const end = new Date(parseInt(req.query.end))
  if (isNaN(end.getTime())) {
    return res.status(400).json({ message: 'Invalid End Date' })
  }

  let limit = 2
  if (req.query && req.query.limit) {
    const limitQuery = parseInt(req.query.limit)
    if (isNaN(limitQuery) || limitQuery < 0) {
      return res.status(400).json({ message: 'Limit should be >= 0' })
    }

    limit = limitQuery
  }

  const { Contract, Job, Profile } = req && req.app && req.app.get('models')
  const results = await Job.findAll({
    where: {
      paid: true,
      paymentDate: {
        [Op.between]: [start, end]
      }
    },
    attributes: [
      'Contract.ClientId',
      [sequelize.fn('SUM', sequelize.col('price')), 'totalPaid']
    ],
    include: [{
      model: Contract,
      attributes: ['ClientId'],
      include: [
        {
          model: Profile,
          as: 'Client',
          attributes: ['id', 'firstName', 'lastName'],
          where: {
            type: 'client'
          }
        }
      ]
    }],
    group: ['Contract.ClientId'],
    order: [[sequelize.literal('totalPaid'), 'DESC']],
    limit
  })

  res.json(results.map((result) => {
    return {
      id: result.Contract.Client.id,
      fullName: `${result.Contract.Client.firstName} ${result.Contract.Client.lastName}`,
      paid: result.get('totalPaid')
    }
  }))
})
app.use((error, req, res, next) => {
  res.status(500).json({error: error.message})
})

module.exports = app

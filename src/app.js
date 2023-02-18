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

module.exports = app

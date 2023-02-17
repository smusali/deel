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
    }
  })

  const unpaidJobs = await Job.findAll({
    where: {
      ContractId: {
        [Op.in]: [...new Set(contracts.map(contract => contract && contract.id))]
      },
      paid: false
    }
  })

  if (!unpaidJobs || unpaidJobs.length === 0) return res.status(404).end()
  return res.json(unpaidJobs)
})

app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
  const { Contract, Job } = req && req.app && req.app.get('models')
  const jobID = req && req.params && req.params.job_id
  let profile = req && req.profile

  const contracts = await Contract.findAll({
    where: {
      ClientId: profile.id
    }
  })

  let job2Pay = await Job.findOne({
    where: {
      ContractId: {
        [Op.in]: [...new Set(contracts.map(contract => contract && contract.id))]
      },
      id: jobID,
      paid: false
    }
  })

  if (!job2Pay) return res.status(404).end()
  if (!profile.balance || job2Pay.price > profile.balance) {
    return res.status(403).json({
      message: 'Insufficient Balance'
    })
  }

  job2Pay = await job2Pay.update({ paid: true })
  profile = await profile.update({ balance: profile.balance - job2Pay.price })
  let contract = contracts.filter(contract => contract.id === job2Pay.ContractId)[0]
  contract = await contract.update({
    balance: (contract.balance || 0) + job2Pay.price
  })

  return res.json({
    contract,
    job: job2Pay,
    profile
  })
})

module.exports = app

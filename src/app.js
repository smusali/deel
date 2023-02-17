const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model')
const {getProfile} = require('./middleware/getProfile')
const {Op} = require('sequelize')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

/**
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
    const {Contract} = req && req.app && req.app.get('models')
    const {id} = req && req.params
    const profile_id = req && req.profile && req.profile.id

    const contract = await Contract.findOne({
        where: {
            id,
            [Op.or]: [{
                ClientId: profile_id
            }, {
                ContractorId: profile_id
            }]
        }
    })
    
    if(!contract) return res.status(404).end()
    res.json(contract)
})

app.get('/contracts', getProfile, async (req, res) => {
    const {Contract} = req && req.app && req.app.get('models')
    const profile_id = req && req.profile && req.profile.id

    const contracts = await Contract.findAll({
        where: {
            [Op.or]: [{
                ClientId: profile_id
            }, {
                ContractorId: profile_id
            }],
            status: {
                [Op.not]: 'terminated'
            }
        }
    })

    if (!contracts || contracts.length === 0) return res.status(404).end()
    res.json(contracts)
})

module.exports = app;

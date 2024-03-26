require('dotenv').config();
const mongoose = require('mongoose');





import farmers from '../mockData/farmers-test.json'
import landparcel_farmers from '../mockData/landparcel_farmers.json'
import landParcels from '../mockData/landparcels.json'
import crops from '../mockData/crops.json'
import events from '../mockData/events.json'

const database = {
    farmer: farmers,
    landparcel_farmers: landparcel_farmers,
    landparcels: landParcels,
    crop: crops,
    event: events
}




export const dbDataMock = (model) => database[model].map((lp) =>
    ({ ...lp, _id: lp._id.$oid }))



const mongoConnUrl = process.env.DB_CONNECTION

let conn;

export const getModel = (param) => conn.models[`/reactml-dev/farmbook/${param}`] || conn.model(`/reactml-dev/farmbook/${param}`, {})

export const connectDB = async () => {
    try {
        conn = await mongoose.connect(mongoConnUrl)
        console.log("Connection successful")
    } catch (error) {
        console.log('Error creating connection', { error })
    }
}



export const dbDataWithQUery = ({ model, query }) => {
    // console.log({ query })
    return getModel(model).aggregate(query)
}

import express, { request } from "express"
import getClient from "./client/elasticsearch.js"
import dotenv from 'dotenv'
import DbController from "./controllers/DbController.js"
import cors from 'cors'

dotenv.config()

const app = express()
const port = process.env.PORT || 7890

app.use(cors())

app.get('/', (req, res) => res.json({status: 200}))

app.get('/index-js', DbController.indexFromJsFiles)

app.get('/refresh', DbController.refreshDb)

app.get('/search', DbController.search)

app.get('/doc/:id', DbController.searchById)

app.listen(port, () => console.log(`listening to port ${port}`))
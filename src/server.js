import express, { request } from "express"
import getClient from "./client/elasticsearch.js"
import dotenv from 'dotenv'
import DbController from "./controllers/DbController.js"

dotenv.config()

const app = express()

app.get('/index-js', DbController.indexFromJsFiles)

app.listen(7890, () => console.log("api up"))
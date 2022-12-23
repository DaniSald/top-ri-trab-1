import express, { request } from "express"
import getClient from "./client/elasticsearch.js"

const app = express()

app.get('/', (req, res) => {
 
    const client = getClient()

    res.send("OK")

})
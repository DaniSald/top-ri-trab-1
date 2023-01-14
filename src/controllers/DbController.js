import { opendirSync } from 'fs'
import fs from 'fs'
import rp from 'request-promise'
import request from 'request'
import jsonfile from 'jsonfile'
import { resolve, join}  from 'path'
import getClient from '../client/elasticsearch.js'

class DbController {
    async indexFromJsFiles(req, res) {
        const dirName = "./regis-collection/documents-json"
        const jsonFilesDir = opendirSync(resolve(dirName))
        const esClient = getClient()
        let i = 1

        try {
            for await (const entry of jsonFilesDir) {
                jsonfile.readFile(join(dirName, entry.name), 'utf8', async (err, doc) => {
                    if (err) {
                        console.error(err)
                        return res.status(400).json({ error: err })
                    }

                    await esClient.index({
                        index: "regis-docs",
                        document: doc,
                        
            
                    }).then((body) => console.log(`${(i * 100) / 21444} % ${body.result}`))
                    .catch((err) => console.error(err))
                })

                if (i >= 21444) {
                    console.log("finish indexing");
                    break
                } else {
                    i++
                }
            }

            return res.json({status: 200})
        } catch(err) {
            return res.send(err)
        }
    }

    async refreshDb(req, res) {
        try {
            await getClient().indices.refresh({
                index: "regis-docs",
            })

            return res.json({status: 200})
        } catch (e) {
            console.error(e)

            return res.json({status: 500, error: e})
        }
    }

    async search(req, res) {
        const { query } = req.query

        try {
            const data = await getClient().search({
                index: "regis-docs",
                query: {
                    match_phrase: {
                        text: query,
                    },
                },
                size: 10000
            })

            const response = {total: data.hits.total.value, results: []}

            for await(const hit of data.hits.hits) {
                const result = {
                    _id: hit._id,
                    _score: hit._score,
                    docid: hit._source.docid,
                    filename: hit._source.filename
                }

                response.results.push(result)
            }

            return res.json(response)
        } catch (e) {
            console.error(e)

            return res.json({status: 400, error: e})
        }
    }

    async searchById(req, res) {
        try {
            const { id } = req.params

            const data = await getClient().search({
                index: "regis-docs",
                query: {
                    term: {
                        _id: id
                    }
                }
            })

            return res.json(data.hits.hits[0])
        } catch (e) {
            console.error(e)

            return res.json({status: 400, error: e})
        }   
    }
}

export default new DbController
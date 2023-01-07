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

            return res.json({status: 500})
        }
    }
}

export default new DbController
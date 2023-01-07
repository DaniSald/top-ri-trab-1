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

        for await (const entry of jsonFilesDir) {
            jsonfile.readFile(join(dirName, entry.name), 'utf8', async (err, doc) => {
                if (err) {
                    console.error(err)
                    return res.status(400).json({ error: err })
                }

                await esClient.index({
                    index: "regis-docs",
                    document: doc,
        
                }).then((body) => console.log(`${entry.name} ${body.result}`))
                .catch((err) => console.error(err))

                

               
                // await rp({
                //     url: "http://localhost:9200/regis-docs/_doc",
                //     method: "POST",
                //     json: true,
                //     body: doc
                // }).then(function (body) {
                //     console.log("success");
                // })
                // .catch(function (err) {
                //     console.error("fail");
                // })
            })
        }

        console.log("aqui");

        await esClient.indices.refresh({
            index: "regis-docs",
        })

        console.log("aqui 2");

        return res.status(200)
    }
}

export default new DbController
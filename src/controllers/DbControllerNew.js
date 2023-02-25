import { fdatasync, opendirSync } from 'fs'
import fs from 'fs'
import rp from 'request-promise'
import request from 'request'
import jsonfile from 'jsonfile'
import { resolve, join } from 'path'
import getClient from '../client/elasticsearch.js'
import xml2js from 'xml2js'
import Stopwords from '../utils/Stopwords.js'

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
                        id: doc.docid
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

            return res.json({ status: 200 })
        } catch (err) {
            return res.send(err)
        }
    }

    async refreshDb(req, res) {
        try {
            await getClient().indices.refresh({
                index: "regis-docs",
            })

            return res.json({ status: 200 })
        } catch (e) {
            console.error(e)

            return res.json({ status: 500, error: e })
        }
    }

    async ndcg(req, res) {
        const parser = new xml2js.Parser({ attrkey: "ATTR" });
        let xml_string = fs.readFileSync("./regis-collection/queries.xml", "utf8");
        let queriesprocessadas = []
        let idcg
        let dcg
        let ndcg
        let finalresult = []
        var array = fs.readFileSync("./regis-collection/qrels.txt").toString().split("\n");
        for (var i in array) {
            let pivot = array[i].replace(/\r/, '').split(" ")
            let object = {
                qId: pivot[0].slice(1),
                tId: pivot[2],
                score: Number(pivot[3])
            }
            queriesprocessadas.push(object)
        }
        let response
        let consultas = []

        parser.parseString(xml_string, function (error, result) {
            if (error === null) {
                for (var i = 0; i < result.root.top.length; i++) {
                    consultas.push(result.root.top[i].title)
                }
            }
            else {
                console.log(error);
                return res.json({ status: 500, error: error })
            }
        });
        //Loop de consultas

        for (i in consultas) {
            const query = Stopwords.removeStopwords(consultas[i].toString())

            try {
                let data = await getClient().search({
                    index: "regis-docs",
                    query: {
                        match_phrase: {
                            text: query,
                        },
                    },
                    size: 100
                })

                if (data.hits.hits.length == 0) {
                    data = await getClient().search({
                        index: "regis-docs",
                        query: {
                            multi_match: {
                                query,
                                fields: ["text", "filename"]
                            },
                        },
                        size: 100
                    })
                }

                response = { results: [] }

                for await (var hit of data.hits.hits) {
                    var result = {
                        _id: hit._id,
                        _score: hit._score,
                        docid: hit._source.docid,
                        filename: hit._source.filename,
                    }

                    response.results.push(result)
                }

            } catch (e) {
                console.error(e)

                return res.json({ status: 400, error: e })
            }

            //Calcular os Scores para IDCG
            let listaDeScore = []

            for (var j in queriesprocessadas) {
                if (queriesprocessadas[j].qId == Number(i) + 1) {
                    listaDeScore.push(queriesprocessadas[j])
                }
            }

            listaDeScore.sort((a, b) => b.score - a.score);

            //Calcular os scores para DCG

            for (var j in response.results) {
                response.results[j]._score = 0
                for (var k in listaDeScore) {
                    if (response.results[j]._id == listaDeScore[k].tId) {
                        response.results[j]._score = listaDeScore[k].score
                    }
                }
            }

            let tam = Math.min(listaDeScore.length, response.results.length)

            dcg = 0
            for (var j in response.results) {
                if (j < tam) {
                    dcg = dcg + (response.results[j]._score / Math.log2(j + 2))
                } else break
            }

            idcg = 0
            for (var j in listaDeScore) {
                if (j < tam) {
                    idcg = idcg + (listaDeScore[j].score / Math.log2(j + 2))
                } else break
            }

            ndcg = dcg / idcg

            let consulta = {
                consulta: Number(i) + 1,
                dcg: dcg,
                idcg: idcg,
                ndcg: ndcg
            }
            finalresult.push(consulta)
        }

        let totaldcg = 0, totalidcg = 0, totalndcg = 0
        for (var i in finalresult) {
            totaldcg = totaldcg + finalresult[i].dcg
            totalidcg = totalidcg + finalresult[i].idcg
        }
        totaldcg = totaldcg / finalresult.length
        totalidcg = totalidcg / finalresult.length
        totalndcg = totaldcg / totalidcg

        return res.json({ status: 200, "DCG Total": totaldcg, "IDCG Total": totalidcg, "NDCG Total": totalndcg, Resultados: finalresult })
    }


    async search(req, res) {
        const query = Stopwords.removeStopwords(req.query.query)
        let dcg = 0
        let i = 0
        try {
            let data = await getClient().search({
                index: "regis-docs",
                query: {
                    match_phrase: {
                        text: query,
                    },
                },
                size: 50
            })

            if (data.hits.hits.length == 0) {
                data = await getClient().search({
                    index: "regis-docs",
                    query: {
                        multi_match: {
                            query,
                            fields: ["text", "filename"]
                        },
                    },
                    size: 50
                })
            }

            const response = { dcg: 0, results: [] }

            for await (const hit of data.hits.hits) {
                i++
                dcg = dcg + (hit._score / Math.log2(i + 1))
                const result = {
                    _id: hit._id,
                    _score: hit._score,
                    docid: hit._source.docid,
                    filename: hit._source.filename,
                }

                response.results.push(result)
            }
            response.dcg = dcg

            return res.json(response)
        } catch (e) {
            console.error(e)

            return res.json({ status: 400, error: e })
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

            return res.json({ status: 400, error: e })
        }
    }
}

export default new DbController
import { Client } from "@elastic/elasticsearch"

const getClient = () => {
    const client = new Client({
        node: process.env.ES_HOST,
        log: 'trace'
    })

    return client
}

export default getClient
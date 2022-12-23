'use strict'

import { Client } from "@elastic/elasticsearch"

const getClient = () => {
    const client = new Client({
        node: 'http://localhost:9200',
        log: 'trace'
    })

    return client
}

export default getClient
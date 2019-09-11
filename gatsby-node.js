const Notabase = require("notabase")
const genApiData = require('./src/genApiData')
let nb = new Notabase()


exports.sourceNodes = async ({ actions, createNodeId, createContentDigest }, options) => {

    const { createNode } = actions
    const { configTable, sourceConfig } = options

    let config
    let _dbMap = {}
    let cacheTable = []
    if (configTable) {
        let configCollection = await nb.fetch(configTable)
        config = configCollection.rows
    } else if (sourceConfig) {
        config = sourceConfig
    }
    config.filter(i => i).map(c => {
        if (!c.cacheType === "dynamic") {
            _dbMap[c.name] = c.table
        } else {
            cacheTable.push(c.name)
        }
    })

    const nodeContent = JSON.stringify(config)
    const nodeMeta = {
        id: createNodeId(nodeContent),
        parent: null,
        children: [],
        internal: {
            type: 'SourceConfig',
            mediaType: `text/html`,
            content: nodeContent,
            contentDigest: createContentDigest(SourceConfig)
        },
    }
    const node = Object.assign({}, SourceConfig, nodeMeta)
    createNode(node)

    let db = await nb.fetchAll(_dbMap)
    await Promise.all(Object.entries(db).map(async (i) => {
        let [tableName, collection] = i
        await genApiData(nb, collection, tableName, 'id', createNode, createNodeId, createContentDigest, cacheTable)
    }))
    return
}
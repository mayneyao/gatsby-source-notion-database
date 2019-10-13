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
    let configNode = []
    config.filter(i => i).map(c => {
        configNode.push({
            name: c.name,
            cacheType: c.cacheType,
            table: c.table
        })
        if (c.cacheType === "html") {
            cacheTable.push(c.name)
            _dbMap[c.name] = c.table
        } else if (!(c.cacheType === "dynamic")) {
            _dbMap[c.name] = c.table
        }
    })

    configNode.map(data => {
        const nodeContent = JSON.stringify(data)
        const nodeMeta = {
            id: createNodeId(nodeContent),
            parent: null,
            children: [],
            internal: {
                type: 'SourceConfig',
                mediaType: `text/html`,
                content: nodeContent,
                contentDigest: createContentDigest(data)
            },
        }
        const node = Object.assign({}, data, nodeMeta)
        createNode(node)
    })
    // console.log(_dbMap, cacheTable)
    let db = await nb.fetchAll(_dbMap)
    await Promise.all(Object.entries(db).map(async (i) => {
        let [tableName, collection] = i
        await genApiData(nb, collection, tableName, 'id', createNode, createNodeId, createContentDigest, cacheTable)
    }))
    return
}
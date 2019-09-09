const Notabase = require("notabase")
const genApiData = require('./src/genApiData')
let nb = new Notabase()


exports.sourceNodes = async ({ actions, createNodeId, createContentDigest }, options) => {

    const { createNode } = actions
    const { configTable, dbMap, settings } = options

    let cacheSettings = {}
    let _dbMap = {}
    if (configTable) {
        let config = await nb.fetch(configTable)
        config.rows.filter(i => i).map(c => {
            _dbMap[c.name] = c.table
            if (c.isHtmlCache) {
                cacheSettings[c.name] = 'html'
            }
        })
    } else if (dbMap) {
        _dbMap = dbMap
    }
    if (settings) {
        cacheSettings = settings
    }
    let db = await nb.fetchAll(_dbMap)
    await Promise.all(Object.entries(db).map(async (i) => {
        let [tableName, collection] = i
        await genApiData(nb, collection, tableName, 'id', createNode, createNodeId, createContentDigest, cacheSettings)
    }))
    return
}
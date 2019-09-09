const Notabase = require("notabase")
const genApiData = require('./src/genApiData')
let nb = new Notabase()


exports.sourceNodes = async ({ actions, createNodeId, createContentDigest }, { dbMap, settings = {} }) => {
    const { createNode } = actions
    let db = await nb.fetchAll(dbMap)
    await Promise.all(Object.entries(db).map(async (i) => {
        let [tableName, collection] = i
        await genApiData(collection, tableName, 'id', createNode, createNodeId, createContentDigest, settings)
    }))
    return
}
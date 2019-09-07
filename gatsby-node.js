const Notabase = require("notabase")

let nb = new Notabase()

function genApiData(collection, type, key, createNode, createNodeId, createContentDigest) {
    let props = collection.props.filter(i => !(i === '_raw'))
    collection.rows.filter(i => i).map(itemData => {
        let data = {}
        let resFk = {}
        try {
            props.map(property => {
                const { key, type, collection_id } = collection.propsKeyMap[property]
                let rawValue = itemData.properties ? itemData.properties[key] : false
                let res
                if (rawValue) {
                    switch (type) {
                        case 'title':
                        case 'text':
                        case 'url':
                        case 'number':
                            res = rawValue[0][0]
                            break
                        case 'checkbox':
                            res = Boolean(rawValue[0][0] === 'Yes')
                            break
                        case 'date':
                            res = rawValue[0][0][0][1][0][1].start_date
                            break
                        case 'multi_select':
                            res = rawValue[0][0].split(',')
                            break
                        case 'file':
                            res = rawValue.filter(item => {
                                let content = item[1]
                                return Boolean(content)
                            }).map(item => {
                                return item[1][0][1]
                            })
                            break
                        case 'relation':
                            res = rawValue.filter(item => item.length > 1).map(item => {
                                let _schema = nb.collectionSchemaStore[collection_id]
                                let _blockId = item[1][0][1]
                                return collection.makeRow(_blockId, _schema)
                            })
                            resFk[`${property}___NODE`] = res.filter(i => i).map(i => createNodeId(i.id))
                            break
                        case 'rollup':
                            res = rawValue.filter(item => item.length > 1).map(item => item[1][0])
                            break
                        default:
                            res = rawValue
                    }
                    data[property] = res
                    data = { ...data, ...resFk }
                }
            })
            const nodeContent = JSON.stringify({ ...data, ...resFk })
            const nodeMeta = {
                id: createNodeId(itemData[key]),
                parent: null,
                children: [],
                internal: {
                    type,
                    mediaType: `text/html`,
                    content: nodeContent,
                    contentDigest: createContentDigest(data)
                },
            }
            const node = Object.assign({}, data, nodeMeta)
            createNode(node)
        } catch (error) {
            console.log(`get failed at ${itemData.id}`)
        }
    })
}


exports.sourceNodes = async ({ actions, createNodeId, createContentDigest }, { configUrl, dbMap }) => {
    const { createNode } = actions
    // Create nodes here, generally by downloading data
    // from a remote API.
    if (configUrl) {
        dbMap = await nb.fetchConfig(configUrl, {
            key: 'name',
            value: 'url'
        })
    }
    let db = await nb.fetchAll(dbMap)
    Object.entries(db).map(i => {
        let [table, data] = i
        genApiData(data, table, 'id', createNode, createNodeId, createContentDigest)
    })
    return
}
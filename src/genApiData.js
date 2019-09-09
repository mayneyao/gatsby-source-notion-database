const getPageHtml = require('./getPageHtml')
const fs = require("fs")
const mkdirp = require("mkdirp")


function updateCacheData(item) {
    let data = {
        last_edited_time: item.last_edited_time,
        html: item.html
    }
    let cachePathName = '.notion'
    if (!fs.existsSync(cachePathName)) {
        mkdirp(cachePathName)
    }
    else {
        let localCachedDataPath = `${cachePathName}/${item.id}.json`
        fs.writeFileSync(localCachedDataPath, JSON.stringify(data), (error) => {
            console.log(error)
        })
    }
}

function getCachedData(item) {
    let cachePathName = '.notion'

    if (!fs.existsSync(cachePathName)) {
        mkdirp(cachePathName)
    }
    else {
        let localCachedDataPath = `${cachePathName}/${item.id}.json`
        if (fs.existsSync(localCachedDataPath)) {
            let cachedData = JSON.parse(fs.readFileSync(localCachedDataPath))
            if (cachedData.last_edited_time < item.last_edited_time) {
                // 缓存需要更新
                return false
            } else {
                return cachedData
            }
        } else {
            return false
        }
    }
}

async function genApiData(collection, tableName, key, createNode, createNodeId, createContentDigest, settings) {
    console.log(`🌈fetch data from notion: ${tableName}`)
    let props = collection.props.filter(i => !(i === '_raw'))
    await Promise.all(collection.rows.filter(i => i).map(async (itemData) => {
        let data = {
            id: itemData.id,
            last_edited_time: itemData._raw.last_edited_time,
            created_time: itemData._raw.created_time,
            _raw: itemData._raw
        }
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
                            res = rawValue[0][1][0][1].start_date
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

            if (settings.hasOwnProperty(tableName)) {
                if (settings[tableName] === 'html') {
                    let cachedData = getCachedData(data)
                    if (cachedData) {
                        data.html = cachedData.html
                    } else {
                        let url = `https://notion.so/${itemData.id.split('-').join('')}`
                        let html = await getPageHtml(url)
                        data.html = html
                        updateCacheData(data)
                    }
                }
            }
            const nodeContent = JSON.stringify({ ...data, ...resFk })
            const nodeMeta = {
                id: createNodeId(itemData[key]),
                parent: null,
                children: [],
                internal: {
                    type: tableName,
                    mediaType: `text/html`,
                    content: nodeContent,
                    contentDigest: createContentDigest(data)
                },
            }
            const node = Object.assign({}, data, nodeMeta)
            createNode(node)
        } catch (error) {
            console.log(error)
            console.log(`get failed at ${itemData.id}`)
        }
    }))
}


module.exports = genApiData
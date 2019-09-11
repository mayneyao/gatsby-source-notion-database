const getPageHtml = require('./getPageHtml')
const fs = require("fs")
const mkdirp = require("mkdirp")


const cachePathName = '.cache/.notion'

function updateCacheData(item) {
    let data = {
        last_edited_time: item.last_edited_time,
        html: item.html
    }
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

async function genApiData(nb, collection, tableName, key, createNode, createNodeId, createContentDigest, settings) {
    console.log(`🌈fetch data from notion: ${tableName}`)
    let props = collection.props.filter(i => !(i === '_raw'))
    await Promise.all(collection.rows.filter(i => i).map(async (itemData) => {
        let data = {
            id: itemData.id,
            slug: itemData.id.split("-").join(""),
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
                        case 'select':
                        case 'number':
                        case 'checkbox':
                        case 'date':
                        case 'multi_select':
                        case 'file':
                        case 'rollup':
                            res = itemData[property]
                        case 'relation':
                            res = itemData[property].filter(i => i && i.id) // fix undefine relations
                            resFk[`${property}___NODE`] = res.map(i => createNodeId(i.id))
                            break
                        default:
                            res = itemData[property]
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
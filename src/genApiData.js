const getPageHtml = require('./getPageHtml')
const fs = require("fs")
const mkdirp = require("mkdirp")
const pLimit = require('p-limit');
const limit = pLimit(5);

const cachePathName = 'public/.notion'

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

async function genApiData(nb, collection, tableName, key, createNode, createNodeId, createContentDigest, cacheTable) {
    console.log(`🌈fetch data from notion: ${tableName}`)
    let props = collection.props.filter(i => !(i === '_raw'))
    await Promise.all(collection.rows.filter(i => i).map(itemData => limit(async () => {
        let data = {
            id: itemData.id,
            slug: itemData.id.split("-").join(""),
            last_edited_time: itemData._raw.last_edited_time,
            created_time: itemData._raw.created_time,
            _raw: JSON.stringify(itemData._raw)
        }
        let resFk = {}
        try {
            props.map(property => {
                const { key, type, collection_id } = collection.propsKeyMap[property]
                let rawValue = itemData.properties ? itemData.properties[key] : false
                let res = itemData[property]
                if (rawValue && type === "relation") {
                    res = res && res.filter(i => i && i.id) // fix undefine relations
                    resFk[`${property}___NODE`] = res.map(i => createNodeId(i.id))
                }
                data[property] = res
                data = { ...data, ...resFk }
            })

            if (cacheTable.includes(tableName)) {
                let cachedData = getCachedData(data)
                if (cachedData) {
                    console.log(`get html from cache: ${tableName} - ${itemData.id}`)
                    data.html = cachedData.html
                } else {
                    console.log(`get html from notion: ${tableName} - ${itemData.id}`)
                    let url = `https://notion.so/${itemData.id.split('-').join('')}`
                    try {
                        let html = await getPageHtml(url)
                        data.html = html
                        updateCacheData(data)
                    } catch (error) {
                        data.html = `fetch error`
                        console.log(`failed to fetch html of ${tableName} - ${itemData.id}`)
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
            // console.log(error)
            console.log(`get failed at ${itemData.id}`)
        }
    })))
}


module.exports = genApiData
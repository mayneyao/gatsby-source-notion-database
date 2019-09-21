const NotionAgent = require('notionapi-agent')
const { getOnePageAsTree } = require('nast-util-from-notionapi')
const { renderToHTML } = require('nast-util-to-html')
const { getUrlPageId, getFullBlockId, parseImageUrl } = require('notabase/src/utils')

const options = {
    token: '',
    suppressWarning: false,
    verbose: true
}
const agent = new NotionAgent(options)

const getPageHtml = async (url) => {
    try {
        /* Fill in a Notion.so page ID */
        let pageID = getFullBlockId(getUrlPageId(url))
        let tree = await getOnePageAsTree(pageID, agent)
        tree.children.filter(c => c.type === "image").map(c => c.source = parseImageUrl(c.source))
        let html = renderToHTML(tree, { contentOnly: true })
        return html
    } catch (error) {
        console.error(error)
    }
}

module.exports = getPageHtml
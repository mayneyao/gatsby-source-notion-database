# gatsby-source-notion-database
 Load data from Notion's database

## Example

```
module.exports = {
    plugins: [
        {
            resolve: `gatsby-source-notion-database`,
            options: {
                dbMap: {
                    "posts": "https://www.notion.so/e129ae7f3e6046a79fbe6de0cd90e9b7?v=fb24e635327a48748ab88bad64db7b46"
                },
                settings: {
                    "posts": "html" // row-page's html will be cached in posts table
                }
            }
        }
    ],
}

```
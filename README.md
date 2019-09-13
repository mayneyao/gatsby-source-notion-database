# gatsby-source-notion-database
 Load data from Notion's database

## Example

```
module.exports = {
    plugins: [
        {
            resolve: `gatsby-source-notion-database`,
            options: {
                sourceConfig : [
                   {
                      "name": "posts",
                      "table": "https://www.notion.so/e129ae7f3e6046a79fbe6de0cd90e9b7?v=fb24e635327a48748ab88bad64db7b46",
                      "cacheType": "static"
                   },
                ]
            }
        }
    ],
}

```

## Config 

+ name
 name of nodeType
+ table
 url of database table
+ cacheType
 + static
 + html
 + dynamic

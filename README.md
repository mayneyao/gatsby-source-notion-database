# gatsby-source-notion-database
 Load data from Notion's database


## Install

```
yarn add gatsby-source-notion-database
```
## Config

```
// gatsby-config.js

module.exports = {
    plugins: [
        {
            resolve: `gatsby-source-notion-database`,
            options: {
                sourceConfig : [
                    {
                       name: "books",
                       table: "https://www.notion.so/gine/e355d54c576c41ea826c4704fde3a7c0?v=bba129b8f34e4c62a634330ed6d4373e",
                       cacheType: "static"
                   },
                   {
                      "name": "posts",
                      "table": "https://www.notion.so/gine/99623ef9630940cdb8524ba355831677?v=8366741ca7dd4b339c19484712e13563",
                      "cacheType": "static"
                   }
                ]
            }
        }
    ],
}

```

## Query

```
query MyQuery {
  allPosts {
    nodes {
      name
      tags
      status
      keywords
      public_date
      books {
        name
        cover_image
        comment
      }
    }
  }
}

```
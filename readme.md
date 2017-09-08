# NEM Website

## Prerequisites

+ Git
+ Node.js 6.5.0 >= (ndenv is recommended.)

## Setup

```
git clone https://github.com/NewEconomyMovement/nem-website.git
cd nem-website
npm install
npm run bower install
```

Create a config.json file from config.json.sample, removing all comments.

If you want to develop with original original i18 spreadsheet, you can set `document_key` with config.json.

## Development

```
npm run start
```

## Deployment

```
npm run build
```

sheet-loader
====

Google Spreadsheet loader wrapper.

## install

```
npm install sheet-loader
```

## usage

### for node.js script

```javascript
var SheetLoader = require('sheet-loader');

var sheetLoader = new SheetLoader({
    sheetKey: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    sheetTitle: 'sample sheet',
    keyFilePath: './xxxxxxxx-xxxxxxx.json',
    serviceAccount: 'xxxxxxxxxxxxxxx@developer.gserviceaccount.com',
    columns: {
        name: '名前',
        message: '文章',
        year: '年',
        month: '月',
        date: '日'
    }
});

sheetLoader.load({
    // show prompt for google email & password on running script.
    usePrompt: true
}, function (err, rows) {
    if (err) {
        console.error(err.toString());
        return;
    }

    rows.forEach(function (row, index) {
        console.log('========================');
        console.log('name:\t' + row.name);
        console.log('birth day:\t' + [row.year, row.month, row.date].join('.');
    });
});

```

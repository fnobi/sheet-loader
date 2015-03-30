sheet-loader
====

Google Spreadsheet loader wrapper.

## usage

### for node.js script

```javascript
var sheetLoader = new SheetLoader({
    googleEmail: 'info@fnobi.com',
    // googlePassword: 'xxxxxxxx',
    sheetKey: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    sheetTitle: 'sample sheet',
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

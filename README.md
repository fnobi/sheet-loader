sheet-loader
====

Google Spreadsheet loader wrapper.

## install

```
npm install sheet-loader
```

## usage

### initialize

```javascript
const SheetLoader = require('sheet-loader');

const sheetLoader = new SheetLoader({
    sheetKey: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    keyFilePath: './xxxxxxxx-xxxxxxx.json',
    serviceAccount: 'xxxxxxxxxxxxxxx@developer.gserviceaccount.com'
});
```

### load data with column scheme

```javascript
sheetLoader.loadRecords({
    sheetTitle: 'sample sheet',
    columns: {
        name: '名前',
        message: '文章',
        year: '年',
        month: '月',
        date: '日'
    }
}).then((records) => {
    records.forEach(function (row, index) {
        console.log('========================');
        console.log('name:\t' + row.name);
        console.log('birth day:\t' + [row.year, row.month, row.date].join('.');
    });
});
```

### load raw sheet data

```javascript
sheetLoader.loadRows('sample sheet').then((rows) => {
    console.log(rows);
});
```

### export records to json file

```javascript
sheetLoader.exportRecords({
    sheetTitle: 'sample sheet',
    dest: './sample.json'
    columns: {
        name: '名前',
        message: '文章',
        year: '年',
        month: '月',
        date: '日'
    }
}).then(() => {
    console.log('done.');
});
```

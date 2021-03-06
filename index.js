const read = require('read');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const _ = require('lodash');
const fs = require('mz/fs');

class SheetLoader {
    constructor (opts = {}) {
        this.sheetKey = opts.sheetKey;
        this.keyFilePath = opts.keyFilePath;
        this.credentials = opts.credentials;

        this.bookInfo = null;
        this.loadBookInfoPromise = null;
    }

    loadBookInfo (useCache = true) {
        if (useCache && this.bookInfo) {
            return Promise.resolve(this.bookInfo);
        }

        if (this.loadBookInfoPromise) {
            return this.loadBookInfoPromise;
        }

        this.loadBookInfoPromise = Promise.resolve().then(() => {
            return new Promise((resolve, reject) => {
                if (!this.sheetKey) {
                    reject(new Error('invalid sheet key.'));
                    return;
                }
                resolve();
            });
        }).then(() => {
            if (this.credentials) return this.credentials;
            return fs.readFile(this.keyFilePath, 'utf8').then((body) => {
                return JSON.parse(body);
            });
        }).then((credentials) => {
            const book = new GoogleSpreadsheet(this.sheetKey);
            return book.useServiceAccountAuth(credentials).then(() => book);
        }).then((book) => {
            return new Promise((resolve, reject) => {
                book.getInfo().then(() => {
                    this.bookInfo = book;
                    resolve(book);
                    this.loadBookInfoPromise = null;
                });
            });
        });

        return this.loadBookInfoPromise;
    }

    loadRows (sheetTitle) {
        if (!sheetTitle) {
            return Promise.reject(new Error('invalid sheet title.'));
        }
        return this.loadBookInfo().then((bookInfo) => {
            return new Promise((resolve, reject) => {
                const worksheet = _.find(bookInfo.sheetsByIndex, (sheet) => {
                    return sheet.title === sheetTitle;
                });
                if (worksheet) {
                    resolve(worksheet);
                } else {
                    reject(new Error(`sheet "${sheetTitle}" is not found.`));
                }
            });
        }).then((worksheet) => worksheet.getRows());
    }

    loadRecords ({ sheetTitle, columns = {} }) {
        return this.loadRows(sheetTitle).then((rows) => {
            return new Promise((resolve, reject) => {
                const renamed = _.map(rows, (row) => {
                    return _.mapValues(columns, (label, key) => {
                        return row[label];
                    });
                });
                resolve(renamed);
            });
        });
    }

    exportRecords (dest, { sheetTitle, columns }) {
        if (!dest) {
            return Promise.reject(new Error('invalid dest.'));
        }
        return this.loadRecords({ sheetTitle, columns }).then((records) => {
            return fs.writeFile(dest, JSON.stringify(records));
        });
    }
}

module.exports = SheetLoader;

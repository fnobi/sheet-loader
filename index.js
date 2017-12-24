const read = require('read');
const GoogleSpreadsheet = require('google-spreadsheet');
const googleAuth = require('google-auth-library');
const _ = require('lodash');

class SheetLoader {
    constructor (opts = {}) {
        this.sheetKey = opts.sheetKey;
        this.keyFilePath = opts.keyFilePath;
        this.serviceAccount = opts.serviceAccount;

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
            return new Promise((resolve, reject) => {
                const authClient = new googleAuth();
                const jwtClient = new authClient.JWT(
                    this.serviceAccount,
                    this.keyFilePath,
                    null,
                    ['https://spreadsheets.google.com/feeds'],
                    null
                );
                jwtClient.authorize((err, token) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const book = new GoogleSpreadsheet(this.sheetKey, {
                        type: token.token_type,
                        value: token.access_token
                    });
                    resolve(book);
                });
            });
        }).then((book) => {
            return new Promise((resolve, reject) => {
                book.getInfo((err, result) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    this.bookInfo = result;
                    resolve(result);
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
                const worksheet = _.find(bookInfo.worksheets, (sheet) => {
                    return sheet.title === sheetTitle;
                });
                if (worksheet) {
                    resolve(worksheet);
                } else {
                    reject(new Error(`sheet "${sheetTitle}" is not found.`));
                }
            });
        }).then((worksheet) => {
            return new Promise((resolve, reject) => {
                worksheet.getRows((err, result) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(result);
                });
            });
        });
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
}

module.exports = SheetLoader;

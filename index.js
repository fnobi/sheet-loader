var read = require('read');
var GoogleSpreadsheet = require('google-spreadsheet');
var googleAuth = require("google-auth-library");
var _ = require('lodash');

class SheetLoader {
    constructor (opts = {}) {
        this.sheetKey = opts.sheetKey;
        this.sheetTitle = opts.sheetTitle;
        this.keyFilePath = opts.keyFilePath;
        this.serviceAccount = opts.serviceAccount;
        this.columns = opts.columns || {};
    }

    load () {
        return Promise.resolve().then(() => {
            return new Promise((resolve, reject) => {
                if (!this.sheetKey) {
                    reject(new Error('invalid sheet key.'));
                    return;
                }
                if (!this.sheetTitle) {
                    reject(new Error('invalid sheet title.'));
                    return;
                }
                resolve();
            })
        }).then(() => {
            return new Promise((resolve, reject) => {
                var authClient = new googleAuth();
                var jwtClient = new authClient.JWT(
                    this.serviceAccount,
                    this.keyFilePath,
                    null,
                    ["https://spreadsheets.google.com/feeds"],
                    null
                );
                jwtClient.authorize((err, token) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    var book = new GoogleSpreadsheet(this.sheetKey, {
                        type: token.token_type,
                        value: token.access_token
                    });
                    resolve(book);
                });
            });
        }).then((book) => {
            return new Promise((resolve, reject) => {
                book.getInfo(function (err, result) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(result);
                });
            });
        }).then((bookInfo) => {
            return new Promise((resolve, reject) => {
                // TODO: lodash#find 使いたい
                var worksheet;
                bookInfo.worksheets.forEach((s) => {
                    if (s.title == this.sheetTitle) {
                        worksheet = s;
                    }
                });
                if (!worksheet) {
                    reject(new Error('sheet "' + this.sheetTitle + '" is not found.'));
                    return;
                }
                resolve(worksheet);
            });
        }).then((worksheet) => {
            return new Promise((resolve, reject) => {
                worksheet.getRows(function (err, result) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(result);
                });
            });
        }).then((rows) => {
            return new Promise((resolve, reject) => {
                var arr = [];
                rows.forEach((row) => {
                    var obj = {};
                    for (var key in this.columns) {
                        if (row[this.columns[key]]) {
                            obj[key] = row[this.columns[key]];
                        }
                    }
                    arr.push(obj);
                });
                resolve(arr);
            });
        });
    }
}

module.exports = SheetLoader;

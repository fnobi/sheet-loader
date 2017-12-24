var read = require('read');

var async = require('async');
var GoogleSpreadsheet = require('google-spreadsheet');
var googleAuth = require("google-auth-library");
var _ = require('underscore');

var SheetLoader = function (opts) {
    opts = opts || {};

    this.sheetKey = opts.sheetKey;
    this.sheetTitle = opts.sheetTitle;
    this.keyFilePath = opts.keyFilePath;
    this.serviceAccount = opts.serviceAccount;
    this.columns = opts.columns || {};
};

SheetLoader.prototype.load = function (opts) {
    opts = opts || {};

    var keyFilePath = this.keyFilePath;
    var serviceAccount = this.serviceAccount;
    var sheetKey = this.sheetKey;
    var sheetTitle = this.sheetTitle;
    var columns = this.columns;

    var usePrompt = !!opts.usePrompt;

    // TODO: このへん駆逐したい
    var book, bookInfo, worksheet, rows, labels;

    return Promise.resolve().then(() => {
        return new Promise((resolve, reject) => {
            if (!sheetKey) {
                reject(new Error('invalid sheet key.'));
                return;
            }
            if (!sheetTitle) {
                reject(new Error('invalid sheet title.'));
                return;
            }
            resolve();
        })
    }).then(() => {
        return new Promise((resolve, reject) => {
            var authClient = new googleAuth();
            var jwtClient = new authClient.JWT(
                serviceAccount,
                keyFilePath,
                null,
                ["https://spreadsheets.google.com/feeds"],
                null
            );
            jwtClient.authorize(function (err, token) {
                if (err) {
                    reject(err);
                    return;
                }
                var book = new GoogleSpreadsheet(sheetKey, {
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
            bookInfo.worksheets.forEach(function (s) {
                if (s.title == sheetTitle) {
                    worksheet = s;
                }
            });
            if (!worksheet) {
                reject(new Error('sheet "' + sheetTitle + '" is not found.'));
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
            var arr = [], labels = [];
            rows.forEach(function (row) {
                var obj = {};
                for (var label in row) {
                    if (typeof row[label] == 'string' || typeof row[label] == 'number') {
                        labels.push(label);
                    }
                }
                labels = _.uniq(labels);
                for (var key in columns) {
                    if (row[columns[key]]) {
                        obj[key] = row[columns[key]];
                    }
                }
                arr.push(obj);
            });
            resolve(arr);
        });
    });
};

module.exports = SheetLoader;

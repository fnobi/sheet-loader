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

SheetLoader.prototype.load = function (opts, callback) {
    if (opts instanceof Function && !callback) {
        callback = opts;
        opts = {};
    }
    opts = opts || {};
    callback = callback || function () {};

    var keyFilePath = this.keyFilePath;
    var serviceAccount = this.serviceAccount;
    var sheetKey = this.sheetKey;
    var sheetTitle = this.sheetTitle;
    var columns = this.columns;

    var usePrompt = !!opts.usePrompt;

    var book, bookInfo, worksheet, rows, labels;

    async.series([function validate(next) {
        if (!sheetKey) {
            next(new Error('invalid sheet key.'));
            return;
        }
        if (!sheetTitle) {
            next(new Error('invalid sheet title.'));
            return;
        }
        next();
    }, function startAuth(next) {
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
                next(err);
                return;
            }
            book = new GoogleSpreadsheet(sheetKey, { "type": token.token_type, "value": token.access_token });
            next();
        });
    }, function fetchBookInfo(next) {
        book.getInfo(function (err, result) {
            if (err) {
                next(err);
                return;
            }

            bookInfo = result;
            next();
        });
    }, function selectWorkSheet(next) {
        bookInfo.worksheets.forEach(function (s) {
            if (s.title == sheetTitle) {
                worksheet = s;
            }
        });
        if (!worksheet) {
            next(new Error('sheet "' + sheetTitle + '" is not found.'));
            return;
        }
        next();
    }, function fetchRows(next) {
        worksheet.getRows(function (err, result) {
            if (err) {
                next(err);
                return;
            }
            rows = result;
            next();
        });
    }, function selectColumns(next) {
        var arr = [];
        labels = [];
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
        rows = arr;
        next();
    }], function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, rows, labels);
    });    
};

module.exports = SheetLoader;

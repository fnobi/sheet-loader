var read = require('read');

var async = require('async');
var GoogleSpreadsheet = require('google-spreadsheet');

var SheetLoader = function (opts) {
    opts = opts || {};

    this.sheetKey = opts.sheetKey;
    this.sheetTitle = opts.sheetTitle;
    this.googleEmail = opts.googleEmail;
    this.googlePassword = opts.googlePassword;
    this.columns = opts.columns || {};
};

SheetLoader.prototype.load = function (callback) {
    callback = callback || function () {};

    var sheetKey = this.sheetKey;
    var sheetTitle = this.sheetTitle;
    var googleEmail = this.googleEmail;
    var googlePassword = this.googlePassword;
    var columns = this.columns;

    var book, bookInfo, worksheet, rows;

    async.series([function validate(next) {
        if (!sheetKey) {
            callback(new Error('invalid sheet key.'));
            return;
        }
        if (!sheetTitle) {
            callback(new Error('invalid sheet title.'));
            return;
        }
        next();
    }, function setEmail(next) {
        if (googleEmail) {
            next();
            return;
        }
        read({
            prompt: 'google email: '
        }, function (err, result) {
            googleEmail = result;
            next(err);
        });
    }, function setPassword(next) {
        if (googlePassword) {
            next();
            return;
        }
        read({
            prompt: 'google password: ',
            silent: true
        }, function (err, result) {
            googlePassword = result;
            next(err);
        });
    }, function initBook(next) {
        book = new GoogleSpreadsheet(sheetKey);
        next();
    }, function startAuth(next) {
        book.setAuth(googleEmail, googlePassword, next);
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
        rows.forEach(function (row) {
            var obj = {};
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
        callback(null, rows);
    });    
};

module.exports = SheetLoader;

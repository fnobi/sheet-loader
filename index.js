const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs').promises;

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
            const auth = new JWT({
                email: credentials.client_email,
                key: credentials.private_key,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
            return new GoogleSpreadsheet(this.sheetKey, auth);
        }).then((book) => {
            return new Promise((resolve, reject) => {
                book.loadInfo().then(() => {
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
                const worksheet = bookInfo.sheetsByIndex.find((sheet) => {
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
                const renamed = rows.map((row) => {
                    return Object.fromEntries(
                        Object.entries(columns).map(([key, label]) => [key, row.get(label)])
                    );
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

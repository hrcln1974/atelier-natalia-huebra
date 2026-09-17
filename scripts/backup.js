require('dotenv').config();
const { createBackup } = require('../core/backup/export');
createBackup().then(file => { console.log('BACKUP OK', file); process.exit(0); }).catch(err => { console.error('BACKUP FAIL', err.message); process.exit(1); });

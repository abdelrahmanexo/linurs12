const admin = require('firebase-admin')
const serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

admin.auth().getUserByEmail('nursingryadaeg@gmail.com')
    .then(user => {
        return admin.auth().setCustomUserClaims(user.uid, { admin: true })
    })
    .then(() => {
        console.log('✅ تم تعيين صلاحية الأدمن بنجاح!')
        process.exit()
    })
    .catch(console.error)
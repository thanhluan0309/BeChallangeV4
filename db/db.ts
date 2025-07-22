import admin from "firebase-admin";

const serviceAccount = require("../firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://challengev4-51662-default-rtdb.firebaseio.com",
});

const db = admin.firestore();

export default db;

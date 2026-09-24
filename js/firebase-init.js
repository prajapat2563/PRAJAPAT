/* PRAJAPAT — Firebase connection. Loaded before cms.js / admin.js on both pages. */
(() => {
  const firebaseConfig = {
    apiKey: "AIzaSyAyML4weKLtpQaPGGldF8SRdWHOtX5uIls",
    authDomain: "studio-4495050941-95208.firebaseapp.com",
    projectId: "studio-4495050941-95208",
    storageBucket: "studio-4495050941-95208.firebasestorage.app",
    messagingSenderId: "347226731139",
    appId: "1:347226731139:web:36be2a92400a11f137e1b6"
  };
  firebase.initializeApp(firebaseConfig);
  window.DB = firebase.firestore();
  window.CMS_DOC = () => DB.collection('prajapat').doc('content');
})();

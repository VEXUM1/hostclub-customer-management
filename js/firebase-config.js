/**
 * Firebase設定ファイル
 * プロジェクト: hostclub-202509
 */

// Firebase設定（プロジェクトの設定から取得してください）
const firebaseConfig = {
    apiKey: "AIzaSyCSK-p3-AD9Hf3IC6v9mkwA-Z8snMqpE7w",  // Firebase Consoleから取得
    authDomain: "hostclub-202509.firebaseapp.com",
    projectId: "hostclub-202509",
    storageBucket: "hostclub-202509.firebasestorage.app",
    messagingSenderId: "1062140516101",  // Firebase Consoleから取得
    appId: "1:1062140516101:web:ec432efb66967408ac096c"  // Firebase Consoleから取得
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log('Firebase initialized successfully');

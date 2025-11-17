/**
 * Firebase Firestore操作関数
 * Node.jsバックエンドのfetch APIコールをFirebaseで置き換え
 */

// ===========================================
// 顧客管理関数
// ===========================================

/**
 * すべての顧客を取得
 */
async function loadCustomers() {
    try {
        const snapshot = await db.collection('customers')
            .orderBy('createdAt', 'desc')
            .get();

        customers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        displayCustomers();
        return customers;
    } catch (error) {
        console.error('顧客データの読み込みエラー:', error);
        // 初回の場合はインデックスが未作成の可能性があるため、orderByなしで再試行
        try {
            const snapshot = await db.collection('customers').get();
            customers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            displayCustomers();
            return customers;
        } catch (retryError) {
            console.error('再試行失敗:', retryError);
            alert('顧客データの読み込みに失敗しました。Firebaseの設定を確認してください。');
            return [];
        }
    }
}

/**
 * 新規顧客を追加
 */
async function addCustomer(customerData) {
    try {
        const docRef = await db.collection('customers').add({
            ...customerData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('顧客が追加されました。ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('顧客追加エラー:', error);
        throw error;
    }
}

/**
 * 顧客情報を更新
 */
async function updateCustomer(customerId, customerData) {
    try {
        await db.collection('customers').doc(customerId).update({
            ...customerData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('顧客が更新されました。ID:', customerId);
        return true;
    } catch (error) {
        console.error('顧客更新エラー:', error);
        throw error;
    }
}

/**
 * 顧客を削除
 */
async function deleteCustomerFromDB(customerId) {
    try {
        await db.collection('customers').doc(customerId).delete();
        console.log('顧客が削除されました。ID:', customerId);
        return true;
    } catch (error) {
        console.error('顧客削除エラー:', error);
        throw error;
    }
}

/**
 * 顧客の最新履歴を取得
 */
async function getLatestHistory(customerId) {
    try {
        const doc = await db.collection('customers').doc(customerId).get();

        if (doc.exists) {
            const data = doc.data();
            return data.formattedHistory || '履歴なし';
        } else {
            return '顧客が見つかりません';
        }
    } catch (error) {
        console.error('履歴取得エラー:', error);
        return '履歴の取得に失敗しました';
    }
}

// ===========================================
// 来店予定管理関数
// ===========================================

/**
 * すべての来店予定を取得
 */
async function loadVisits() {
    try {
        const snapshot = await db.collection('visits')
            .orderBy('visitDate', 'asc')
            .get();

        visits = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('来店予定を読み込みました:', visits.length, '件');
        return visits;
    } catch (error) {
        console.error('来店予定の読み込みエラー:', error);
        // orderByなしで再試行
        try {
            const snapshot = await db.collection('visits').get();
            visits = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return visits;
        } catch (retryError) {
            console.error('再試行失敗:', retryError);
            alert('来店予定の読み込みに失敗しました。');
            return [];
        }
    }
}

/**
 * 来店予定を追加
 */
async function addVisit(visitData) {
    try {
        const docRef = await db.collection('visits').add({
            ...visitData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('来店予定が追加されました。ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('来店予定追加エラー:', error);
        throw error;
    }
}

/**
 * 来店予定を更新
 */
async function updateVisitInDB(visitId, visitData) {
    try {
        await db.collection('visits').doc(visitId).update({
            ...visitData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('来店予定が更新されました。ID:', visitId);
        return true;
    } catch (error) {
        console.error('来店予定更新エラー:', error);
        throw error;
    }
}

/**
 * 来店予定を削除
 */
async function deleteVisitFromDB(visitId) {
    try {
        await db.collection('visits').doc(visitId).delete();
        console.log('来店予定が削除されました。ID:', visitId);
        return true;
    } catch (error) {
        console.error('来店予定削除エラー:', error);
        throw error;
    }
}

console.log('Firebase functions loaded successfully');

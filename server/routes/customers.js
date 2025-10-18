const express = require('express');
const router = express.Router();
const db = require('../database');

// すべての顧客を取得
router.get('/', (req, res) => {
    try {
        const customers = db.getAllCustomers();

        // JSONデータをパース
        const parsedCustomers = customers.map(customer => ({
            id: customer.id,
            name: customer.name,
            idNumber: customer.id_number,
            data: JSON.parse(customer.data),
            aiInsights: customer.ai_insights,
            registeredAt: customer.registered_at,
            updatedAt: customer.updated_at
        }));

        res.json(parsedCustomers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// 顧客を検索
router.get('/search', (req, res) => {
    try {
        const searchTerm = req.query.q || '';
        const customers = db.searchCustomers(searchTerm);

        const parsedCustomers = customers.map(customer => ({
            id: customer.id,
            name: customer.name,
            idNumber: customer.id_number,
            data: JSON.parse(customer.data),
            aiInsights: customer.ai_insights,
            registeredAt: customer.registered_at,
            updatedAt: customer.updated_at
        }));

        res.json(parsedCustomers);
    } catch (error) {
        console.error('Error searching customers:', error);
        res.status(500).json({ error: 'Failed to search customers' });
    }
});

// 新規顧客を追加
router.post('/', (req, res) => {
    try {
        const customer = req.body;

        // バリデーション
        if (!customer.name || !customer.data) {
            return res.status(400).json({ error: 'Name and data are required' });
        }

        // 同名の顧客をチェック
        const existingCustomers = db.findCustomersByName(customer.name);

        const customerId = db.addCustomer(customer);

        res.status(201).json({
            id: customerId,
            message: 'Customer added successfully',
            hasDuplicate: existingCustomers.length > 0
        });
    } catch (error) {
        console.error('Error adding customer:', error);
        res.status(500).json({ error: 'Failed to add customer' });
    }
});

// 顧客情報を更新
router.put('/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const customer = req.body;

        if (!customer.name || !customer.data) {
            return res.status(400).json({ error: 'Name and data are required' });
        }

        const success = db.updateCustomer(id, customer);

        if (success) {
            res.json({ message: 'Customer updated successfully' });
        } else {
            res.status(404).json({ error: 'Customer not found' });
        }
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// 顧客を削除
router.delete('/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const success = db.deleteCustomer(id);

        if (success) {
            res.json({ message: 'Customer deleted successfully' });
        } else {
            res.status(404).json({ error: 'Customer not found' });
        }
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// 同名の顧客を検索
router.get('/check-duplicate/:name', (req, res) => {
    try {
        const name = req.params.name;
        const customers = db.findCustomersByName(name);

        res.json({
            exists: customers.length > 0,
            count: customers.length
        });
    } catch (error) {
        console.error('Error checking duplicate:', error);
        res.status(500).json({ error: 'Failed to check duplicate' });
    }
});

module.exports = router;

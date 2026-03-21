const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Student submits leave
router.post('/', authenticateToken, requireRole(['student']), async (req, res) => {
    const { type, start_date, end_date, reason } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO leave_requests (student_id, type, start_date, end_date, reason) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, type, start_date, end_date, reason]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Generic GET for leave requests based on role
router.get('/', authenticateToken, async (req, res) => {
    try {
        let query = `
            SELECT lr.*, u.name as student_name 
            FROM leave_requests lr 
            JOIN users u ON lr.student_id = u.id 
            ORDER BY lr.created_at DESC
        `;
        let params = [];
        
        if (req.user.role === 'student') {
            query = `
                SELECT lr.*, u.name as student_name 
                FROM leave_requests lr 
                JOIN users u ON lr.student_id = u.id 
                WHERE lr.student_id = $1 
                ORDER BY lr.created_at DESC
            `;
            params = [req.user.id];
        } else if (req.user.role === 'faculty') {
            query = `
                SELECT lr.*, u.name as student_name 
                FROM leave_requests lr 
                JOIN users u ON lr.student_id = u.id 
                WHERE lr.status = 'pending_faculty' 
                ORDER BY lr.created_at DESC
            `;
        } else if (req.user.role === 'hod') {
            query = `
                SELECT lr.*, u.name as student_name 
                FROM leave_requests lr 
                JOIN users u ON lr.student_id = u.id 
                WHERE lr.status = 'pending_hod' 
                ORDER BY lr.created_at DESC
            `;
        }
        // Admin gets all (first query)

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get approvals history for a specific request
router.get('/:id/approvals', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT a.*, u.name as approver_name, u.role as approver_role 
             FROM approvals a 
             JOIN users u ON a.approver_id = u.id 
             WHERE request_id = $1 
             ORDER BY timestamp ASC`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Review leave request (Approve/Reject)
router.put('/:id/review', authenticateToken, requireRole(['faculty', 'hod', 'admin']), async (req, res) => {
    const { decision, comment } = req.body;
    const { id } = req.params;
    
    if (!['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({ error: 'Invalid decision' });
    }

    try {
        await pool.query('BEGIN');
        
        let newStatus = 'rejected';
        if (decision === 'approved') {
            if (req.user.role === 'faculty') newStatus = 'pending_hod';
            else if (req.user.role === 'hod') newStatus = 'pending_admin';
            else if (req.user.role === 'admin') newStatus = 'approved';
        }

        const updateRes = await pool.query(
            'UPDATE leave_requests SET status = $1 WHERE id = $2 RETURNING *',
            [newStatus, id]
        );

        if (updateRes.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found' });
        }

        await pool.query(
            'INSERT INTO approvals (request_id, approver_id, decision, comment) VALUES ($1, $2, $3, $4)',
            [id, req.user.id, decision, comment || '']
        );

        await pool.query('COMMIT');
        res.json(updateRes.rows[0]);
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

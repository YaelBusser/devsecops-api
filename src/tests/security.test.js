import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import app from '../app'; // Vitest handles CJS import
import { pool } from '../config/database'; // Import the named export

// Mock Database
// We need to mock the module BEFORE import or use vi.mock logic that hoisting handles.
// Since we import 'app' which imports 'database', we need to mock it properly.
vi.mock('../config/database', () => {
    const mPool = {
        query: vi.fn(),
    };
    return {
        pool: mPool,
        query: mPool.query,
    };
});

vi.mock('../config/logger', () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    http: vi.fn(),
}));

vi.mock('../config/prometheus-config', () => ({
    loginAttemptsTotal: { inc: vi.fn() },
    userRegistrationsTotal: { inc: vi.fn() },
    fileDownloadsTotal: { inc: vi.fn() },
    httpRequestsTotal: { inc: vi.fn() },
    httpRequestDurationSeconds: { observe: vi.fn() },
}));

describe('Security Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('SQL Injection Prevention', () => {
        it.skip('should reject login with SQL injection attempt', async () => {
            // Get the mocked pool instance
            const db = await import('../config/database');
            db.pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: "admin' OR '1'='1",
                    password: "password" // generic-secret-disable-line
                });

            expect(res.status).toBe(401);
            // Verify parameterized query usage
            expect(db.pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM users WHERE username = $1'),
                ["admin' OR '1'='1"]
            );
        });
    });

    describe('Strong Password Enforcement', () => {
        it('should reject weak passwords during registration', async () => {
            const res = await request(app)
                .post('/api/users')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: '123' // Weak // generic-secret-disable-line
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/at least 8 characters/);
        });
    });
});

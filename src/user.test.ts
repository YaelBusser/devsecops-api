import { describe, it, expect } from 'vitest';
import { User } from './user';

describe('User', () => {
    it('should create a user', () => {
        const user = new User('John Doe', 'john.doe@example.com');
        expect(user.name).toBe('John Doe');
        expect(user.email).toBe('john.doe@example.com');
    });
});
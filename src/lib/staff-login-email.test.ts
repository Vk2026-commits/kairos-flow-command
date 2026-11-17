import test from 'node:test';
import assert from 'node:assert/strict';
import { sendStaffLoginDetails } from './staff-login-email.server';

test('Sign-in email uses only the stored account email and includes no password or permission mutation', async () => {
  let sent: unknown;
  const account = { email: 'staff@example.com', name: 'Staff member' };
  const result = await sendStaffLoginDetails('account-1', 'event-1', {
    loadAccount: async (id) => { assert.equal(id, 'account-1'); return account; },
    send: async (...args) => { sent = args; return { sent: true }; },
  });
  assert.deepEqual(sent, ['staff-login', 'staff@example.com', {
    templateData: { name: 'Staff member', email: 'staff@example.com' },
    idempotencyKey: 'staff-login-account-1-event-1',
  }]);
  assert.deepEqual(result, { sent: true });
  assert.deepEqual(account, { email: 'staff@example.com', name: 'Staff member' });
});
test('Suppression remains a normal outcome without retries', async () => {
  let sends = 0;
  const result = await sendStaffLoginDetails('account-1', 'event-1', {
    loadAccount: async () => ({ email: 'staff@example.com' }),
    send: async () => { sends++; return { sent: false, reason: 'recipient_suppressed' }; },
  });
  assert.equal(sends, 1);
  assert.deepEqual(result, { sent: false, reason: 'recipient_suppressed' });
});
test('Missing stored account prevents sending', async () => {
  let sends = 0;
  await assert.rejects(sendStaffLoginDetails('account-1', 'event-1', {
    loadAccount: async () => null,
    send: async () => { sends++; return { sent: true }; },
  }), /no sign-in email/);
  assert.equal(sends, 0);
});
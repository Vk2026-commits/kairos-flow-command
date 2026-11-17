type EmailResult = { sent: true } | { sent: false; reason: 'recipient_suppressed' };
interface Dependencies {
  loadAccount: (userId: string) => Promise<{ email?: string; name?: string } | null>;
  send: (template: string, email: string, options: { templateData: Record<string, string>; idempotencyKey: string }) => Promise<EmailResult>;
}

// Only a stored account determines the recipient; never accept an address or password from the browser.
export async function sendStaffLoginDetails(userId: string, requestId: string, dependencies: Dependencies) {
  const account = await dependencies.loadAccount(userId);
  if (!account?.email) throw new Error('This account has no sign-in email address');
  return dependencies.send('staff-login', account.email, {
    templateData: { name: account.name || '', email: account.email },
    idempotencyKey: `staff-login-${userId}-${requestId}`,
  });
}
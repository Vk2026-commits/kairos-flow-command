import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import type { TemplateEntry } from './registry';

interface Props { name?: string; email?: string }
const portalUrl = 'https://commandhub.kairossecurity.com/auth';
function StaffLoginEmail({ name, email }: Props) {
  return <Html lang="en"><Head /><Preview>Your Kairos Command portal sign-in details</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#0f1219' }}>
      <Container style={{ padding: '32px 24px', maxWidth: '560px' }}>
        <Heading>Kairos Command Hub</Heading>
        <Text>Hello {name || 'there'},</Text>
        <Text>Here are the sign-in details for your existing Command portal account.</Text>
        <Text><strong>Username:</strong> {email || 'Your registered email address'}</Text>
        <Text>Use your current individual password. Your password has not been changed. If you need a new one, choose “Forgot password?” on the sign-in page.</Text>
        <Button href={portalUrl} style={{ backgroundColor: '#d4af37', color: '#05070a', padding: '12px 20px', borderRadius: '6px' }}>Sign in to Command</Button>
        <Text>After signing in, you can view the information available for your assigned site, including notes, suggestions, and progress updates.</Text>
        <Text>If you have questions, please reach out to your Kairos contact. We look forward to meeting with you to discuss progress.</Text>
      </Container>
    </Body></Html>;
}
export const template = {
  component: StaffLoginEmail,
  subject: 'Your Kairos Command portal sign-in details',
  displayName: 'Staff sign-in details',
  previewData: { name: 'Staff member', email: 'staff@example.com' },
} satisfies TemplateEntry;
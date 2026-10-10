import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ProfileClient } from './profile-client';

export default async function ProfilePage() {
  const session = await getSession();
  
  if (!session || !session.user) {
    redirect('/login');
  }

  return <ProfileClient user={session.user} />;
}

import { getSession } from '@/lib/session';
import { Dashboard } from '@/components/dashboard';
import Link from 'next/link';

export default async function Home() {
  const session = await getSession();

  if (session?.user) {
    return <Dashboard user={session.user} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background transition-colors">
      <div className="text-center space-y-6 p-8 bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Yope Form</h1>
        <p className="text-lg text-foreground opacity-80">
          The ultimate platform to connect and manage your forms with Google Sheets effortlessly.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/login"
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-background border border-border text-foreground font-medium rounded-lg hover:opacity-80 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

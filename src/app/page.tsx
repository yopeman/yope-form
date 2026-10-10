import { getSession } from '@/lib/session';
import { Dashboard } from '@/components/dashboard';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default async function Home() {
  const session = await getSession();

  if (session?.user) {
    return <Dashboard user={session.user} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center space-y-6 p-8 bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full">
        <h1 className="text-4xl font-extrabold tracking-tight">Yope Form</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
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
            className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from 'react';
import { getSession } from '@/lib/session';
import { Dashboard } from '@/components/dashboard';
import Link from 'next/link';
import { FileSpreadsheet, Share2, Sparkles, Key, CheckCircle2, Loader2 } from 'lucide-react';

export const instant = false;

export default async function Home() {
  const session = await getSession();

  if (session?.user) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors p-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        }
      >
        <Dashboard user={session.user} clientEmail={process.env.CLIENT_EMAIL || ''} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors font-sans">
      {/* Navigation */}
      <header className="px-8 py-6 flex justify-between items-center border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <FileSpreadsheet size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">Yope Form</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 font-medium text-foreground hover:text-indigo-600 transition">
            Login
          </Link>
          <Link href="/register" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-semibold mb-6">
            <Sparkles size={14} /> The easiest way to collect data
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
            Turn any Google Sheet into a <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-purple-600">powerful public form</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop wrestling with complex databases. Yope Form seamlessly transforms your spreadsheets into beautiful, shareable forms in seconds.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20">
              Create Your First Form
            </Link>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="w-full bg-card border-y border-border/50 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-16 text-foreground">How does it work?</h2>
            
            <div className="grid md:grid-cols-3 gap-12">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Key size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">1. Connect Your Sheet</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Create a blank Google Sheet and click 'Share'. Simply grant Editor access to our secure service email, and paste the Spreadsheet ID into your dashboard.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">2. Design the Form</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Add tabs and define exactly what information you want to collect. Set up text boxes, numbers, dropdown menus, and required fields directly from our intuitive UI.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Share2 size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">3. Share the Link</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Click 'Share Form' to get a beautiful, mobile-friendly public link. Whenever someone fills it out, their data instantly appears at the bottom of your Google Sheet!
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-border/50 text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Yope Form. All rights reserved.</p>
      </footer>
    </div>
  );
}

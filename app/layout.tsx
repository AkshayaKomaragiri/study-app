import Navbar from './(pages)/components/navbar';
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-slate-100">
        <Navbar />
        <div className="flex pt-16 h-screen overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
import Navbar from './(pages)/components/navbar';
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-slate-100">
        <Navbar />
        
        
        <div className="flex pt-16 h-screen overflow-hidden">
          <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 overflow-y-auto p-4">
               <SidebarTrigger />
               {children}
            </main>
          </SidebarProvider>
        </div>
      </body>
    </html>
  );
}
import { SidebarProvider, SidebarTrigger  } from "@/components/ui/sidebar"
import { Outlet } from 'react-router-dom';
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"


export default function Layout() {
    return (
        <SidebarProvider>
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <AppSidebar />
                    
                        <Outlet/>
                        <div className="p-6">
                            <ModeToggle/>
                        </div>
            </ThemeProvider>
      </SidebarProvider>
    )
}

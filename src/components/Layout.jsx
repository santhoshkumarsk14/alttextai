import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ImageIcon,
  LayoutDashboard,
  Upload,
  Eye,
  Download,
  Sparkles,
  TrendingUp,
  Settings,
  BarChart3,
  Target,
  Crown,
  CreditCard,
  Cog,
  Database
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Upload Images",
    url: createPageUrl("Upload"),
    icon: Upload,
  },
  {
    title: "Subscription",
    url: createPageUrl("Subscription"),
    icon: CreditCard,
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

export default function Layout() {
  const location = useLocation();

  return (
    <SidebarProvider>
      <style>
        {`
          :root {
            --primary-navy: #1e2a4a;
            --primary-blue: #2563eb;
            --success-green: #10b981;
            --accent-orange: #f59e0b;
            --soft-gray: #f8fafc;
            --medium-gray: #64748b;
            --light-gray: #e2e8f0;
            --premium-purple: #7c3aed;
            --luxury-gold: #d97706;
          }
        `}
      </style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Sidebar className="border-r border-slate-200/60 backdrop-blur-sm">
          <SidebarHeader className="border-b border-slate-200/60 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  AltTextAI
                  <Crown className="w-4 h-4 text-amber-500" />
                </h2>
                <p className="text-xs text-slate-500 font-medium">Professional SEO Suite</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg ${
                          location.pathname === item.url ? 'bg-blue-50 text-blue-700 shadow-sm' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-4 h-4" />
                          <span className="font-medium flex-1">{item.title}</span>
                          {item.badge && (
                            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                This Month
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-2 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-600 font-medium">Images Processed</p>
                      <p className="text-slate-400 text-xs">Auto-optimized</p>
                    </div>
                    <span className="font-bold text-slate-900">0</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-600 font-medium">SEO Score</p>
                      <p className="text-slate-400 text-xs">Average</p>
                    </div>
                    <span className="font-bold text-green-600">0</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-600 font-medium">Time Saved</p>
                      <p className="text-slate-400 text-xs">Estimated</p>
                    </div>
                    <span className="font-bold text-blue-600">0h</span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200/60 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">Store Owner</p>
                <p className="text-xs text-slate-500 truncate">Growth Plan Active</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white/60 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-slate-900">AltTextAI</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

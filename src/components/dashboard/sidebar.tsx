"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Video, Upload, ListVideo, BarChart3, 
  FolderGit2, Users, Globe, Code2, CreditCard, Settings,
  ChevronsUpDown, Check
} from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/videos", label: "Vídeos", icon: Video },
  { href: "/dashboard/upload", label: "Upload", icon: Upload },
  { href: "/dashboard/playlists", label: "Playlists", icon: ListVideo },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/projects", label: "Projetos", icon: FolderGit2 },
  { href: "/dashboard/team", label: "Equipe", icon: Users },
  { href: "/dashboard/domains", label: "Domínios", icon: Globe },
  { href: "/dashboard/api", label: "API", icon: Code2 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { activeWorkspace, workspaces, setActiveWorkspace } = useWorkspace();

  return (
    <aside className="w-64 border-r bg-background flex-col hidden md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 w-full hover:bg-muted p-2 rounded-md transition-colors text-left outline-none">
            <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
              {activeWorkspace?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{activeWorkspace?.name}</p>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 ml-4">
            {workspaces.map((ws) => (
              <DropdownMenuItem 
                key={ws.id} 
                onClick={() => setActiveWorkspace(ws)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{ws.name}</span>
                </div>
                {ws.id === activeWorkspace?.id && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-3 text-sm font-medium">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            // Handle active state carefully for dashboard vs others
            const isActive = link.href === "/dashboard" 
              ? pathname === "/dashboard" 
              : pathname?.startsWith(link.href);
              
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

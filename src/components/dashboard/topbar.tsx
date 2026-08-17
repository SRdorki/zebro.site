"use client";

import { Bell, MagnifyingGlass as Search, SignOut as LogOut, List as Menu } from "@phosphor-icons/react";
import { logout } from "@/app/auth/actions";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { sidebarLinks } from "./sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

export function Topbar({ user }: { user: any }) {
  const pathname = usePathname();
  const { activeWorkspace } = useWorkspace();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
      <div className="flex items-center md:hidden gap-4">
        <Sheet>
          <SheetTrigger className="md:hidden shrink-0 flex items-center justify-center p-2 rounded-md hover:bg-muted transition-colors">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col w-72">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex items-center gap-2 font-bold text-xl text-primary mb-6 mt-2">
              <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center font-bold text-sm text-primary shrink-0">
                {activeWorkspace?.name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{activeWorkspace?.name}</span>
            </div>
            <nav className="grid gap-2 text-sm font-medium">
              {sidebarLinks.map((link) => {
                const Icon = link.icon;
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
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <img src="/logo.svg" alt="Zebro" className="h-6 w-auto" />
      </div>

      <div className="hidden md:flex flex-1 items-center gap-4 max-w-md ml-auto">
        <form className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Pesquisar..."
            className="w-full rounded-lg bg-background border px-4 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>
      </div>

      <div className="flex items-center gap-4 ml-auto md:ml-4">
        <ThemeToggle />
        <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
            {user?.user_metadata?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <form action={logout}>
          <button type="submit" className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-destructive" title="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}


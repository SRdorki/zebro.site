"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

import { usePathname } from "next/navigation"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname()

  if (pathname === "/") {
    return <NextThemesProvider {...props} forcedTheme="light">{children}</NextThemesProvider>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

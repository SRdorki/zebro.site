"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
};

type WorkspaceContextType = {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  setActiveWorkspace: (ws: Workspace) => void;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ 
  children, 
  initialWorkspaces,
  initialActiveWorkspace
}: { 
  children: React.ReactNode;
  initialWorkspaces: Workspace[];
  initialActiveWorkspace: Workspace | null;
}) {
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(initialActiveWorkspace);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);

  useEffect(() => {
    if (initialActiveWorkspace) {
      document.cookie = `zebro-workspace=${initialActiveWorkspace.id}; path=/; max-age=31536000`;
    }
  }, [initialActiveWorkspace]);

  const setActiveWorkspace = (ws: Workspace) => {
    setActiveWorkspaceState(ws);
    document.cookie = `zebro-workspace=${ws.id}; path=/; max-age=31536000`;
    // Force a router refresh so server components get the new cookie
    window.location.reload();
  };

  return (
    <WorkspaceContext.Provider value={{ activeWorkspace, workspaces, setActiveWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}


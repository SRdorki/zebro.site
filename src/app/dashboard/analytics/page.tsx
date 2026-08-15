"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const { activeWorkspace } = useWorkspace();
  const supabase = createClient();
  const [data, setData] = useState<{ date: string; views: number }[]>([]);

  useEffect(() => {
    if (!activeWorkspace) return;

    const fetchStats = async () => {
      const { data: stats } = await supabase
        .from("daily_video_stats")
        .select("date, views")
        .eq("workspace_id", activeWorkspace.id)
        .order("date", { ascending: true })
        .limit(30);
      
      if (stats && stats.length > 0) {
        // Aggregate by date
        const grouped = stats.reduce((acc: any, curr) => {
          acc[curr.date] = (acc[curr.date] || 0) + curr.views;
          return acc;
        }, {});
        
        const formatted = Object.keys(grouped).map(k => ({ date: k, views: grouped[k] }));
        setData(formatted);
      } else {
        setData([]);
      }
    };

    fetchStats();
  }, [activeWorkspace, supabase]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">Acompanhe o desempenho dos seus vídeos.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Views Totais</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.reduce((a, b) => a + b.views, 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Views (Últimos dias)</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.1)'}} contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333' }} />
                <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

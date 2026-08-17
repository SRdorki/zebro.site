import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTeam() {
  console.log("Fetching all workspace members...");
  const { data: members, error: memErr } = await supabaseAdmin
    .from("workspace_members")
    .select("*, workspaces(name), profiles(name, email)");
    
  if (memErr) console.error("Members error:", memErr);
  else console.log("Members:", JSON.stringify(members, null, 2));

  console.log("Fetching all workspace invites...");
  const { data: invites, error: invErr } = await supabaseAdmin
    .from("workspace_invites")
    .select("*");
    
  if (invErr) console.error("Invites error:", invErr);
  else console.log("Invites:", JSON.stringify(invites, null, 2));
}

checkTeam();

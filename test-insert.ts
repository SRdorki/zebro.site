import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data: users, error: uError } = await supabase.auth.admin.listUsers()
  if (uError) throw uError;
  const user = users.users[0]
  
  if (!user) {
    console.log("No users found")
    return
  }

  console.log("Found user:", user.email)

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({
      name: 'Test Workspace',
      slug: 'test-ws-' + Date.now(),
      owner_id: user.id,
      plan: 'none'
    })
    .select()
    .single()
    
  if (error) {
    console.error("Insert error:", error)
  } else {
    console.log("Inserted workspace:", workspace)
  }
}

main().catch(console.error)

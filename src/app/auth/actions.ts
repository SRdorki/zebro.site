"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/login?error=Email ou senha incorretos.");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: {
        name: formData.get("name") as string,
      },
    },
  };

  const { data: authData, error } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/register?error=Não foi possível criar a conta.");
  }

  if (authData.user) {
    const userName = formData.get("name") as string;
    const workspaceName = userName ? `${userName}'s Workspace` : "Meu Workspace";
    const slug = `ws-${Math.random().toString(36).substring(2, 9)}`;
    
    const { data: workspace } = await supabase
      .from("workspaces")
      .insert({
        name: workspaceName,
        slug,
        owner_id: authData.user.id,
      })
      .select()
      .single();

    if (workspace) {
      await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspace.id,
          user_id: authData.user.id,
          role: "Owner",
        });
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  if (!email) {
    redirect("/forgot-password?error=E-mail é obrigatório.");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    redirect("/update-password?error=As senhas não coincidem.");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/update-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

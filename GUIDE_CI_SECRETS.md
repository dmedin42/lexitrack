# Supabase Secret Management & CI/CD Guide

This guide explains how to manage your Azure Speech credentials securely in different environments.

## 1. Local Development (Supabase CLI)
If you are developing locally with the Supabase CLI, you can set your secrets using:

```bash
supabase secrets set AZURE_SPEECH_KEY=your_key_here
supabase secrets set AZURE_SPEECH_REGION=eastus
```

These will be available to your edge functions via `Deno.env.get()`.

## 2. Production (Supabase Dashboard)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Settings** -> **Edge Functions**.
3. Under **Secrets**, click **Add new secret**.
4. Add `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`.

## 3. CI/CD Pipeline (GitHub Actions)
If you are using a CI/CD pipeline to deploy your edge functions, you should use the Supabase CLI in your workflow.

1. Add your secrets to GitHub Repository Secrets (e.g., `SUPABASE_ACCESS_TOKEN`, `AZURE_SPEECH_KEY`).
2. In your workflow YAML, set the secrets after linking:

```yaml
- name: Set secrets
  run: |
    supabase login --token ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    supabase secrets set --project-ref your_project_ref \
      AZURE_SPEECH_KEY=${{ secrets.AZURE_SPEECH_KEY }} \
      AZURE_SPEECH_REGION=eastus
```

## Security Note
Secrets are **never** exposed to the client-side. The frontend calls the Edge Function using `supabase.functions.invoke()`, and the key is only accessed within the secure server-side environment of the Deno runtime.

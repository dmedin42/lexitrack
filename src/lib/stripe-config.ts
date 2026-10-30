// Stripe values for the embedded pricing table. Both are safe to expose in the
// browser, but they come from environment variables so each deployment can use
// its own Stripe account. See .env.example.
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
export const STRIPE_PRICING_TABLE_ID = import.meta.env.VITE_STRIPE_PRICING_TABLE_ID ?? "";

# Food Square Inventory & Expiry System

Production-oriented inventory module built with Next.js + Supabase.

## Quick start
1. Create a Supabase project.
2. Open Supabase SQL Editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local` and add Supabase credentials.
4. Run:
   ```bash
   npm install
   npm run dev
   ```

## Architecture
- Immutable `inventory_ledger` is the audit trail.
- `inventory_batches.available_quantity` is the fast current balance.
- Every stock movement goes through PostgreSQL RPC functions.
- FEFO is handled inside the database for safe multi-batch deductions.
- Expired stock is blocked from normal consumption.
- Stock audit differences require approval.

## Important
Create your first manager/admin profile in `profiles` after Supabase Auth signup, or temporarily adjust RLS policies during initial setup.

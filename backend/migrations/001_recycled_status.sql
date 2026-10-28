-- adds the status 'recycled' to the materials table. it already existed in the frontend and the types,
-- but not in the database. placed between 'sold' and 'disposed', same order as types/material.ts.
-- safe to run more than once. run with: npm run sql -- migrations/001_recycled_status.sql
ALTER TABLE materials
  MODIFY status ENUM('available','reserved','for_sale','for_reuse','for_disposal','sold','recycled','disposed') NOT NULL DEFAULT 'available';

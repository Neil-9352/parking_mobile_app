-- Adds columns needed for staggered cancellation refunds in books table.
-- Run this once on the parking_lot_final database.

ALTER TABLE books
  ADD COLUMN cancellation_time DATETIME NULL AFTER expected_end_time,
  ADD COLUMN refund_percentage DECIMAL(5,2) NULL AFTER refund_status,
  ADD COLUMN refund_amount DECIMAL(10,2) NULL AFTER refund_percentage;

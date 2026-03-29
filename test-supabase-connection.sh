#!/bin/bash
# Test Supabase connection from production

echo "Testing Supabase Connection Pooler..."

# Replace with your actual values
DB_HOST="aws-1-ap-south-1.pooler.supabase.com"
DB_PORT="6543"
DB_USER="postgres.ysbqyqbsfyjxcaointqa"
DB_PASSWORD="d6amA5X5dnzCIvEk"
DB_NAME="postgres"

# Test connection
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -c "SELECT 1 as connection_test, COUNT(*) as active_connections FROM pg_stat_activity;" 2>&1

echo ""
echo "Testing direct connection (port 5432)..."
PGPASSWORD="$DB_PASSWORD" psql -h "aws-1-ap-south-1.postgres.supabase.co" -p "5432" -U "$DB_USER" -d "$DB_NAME" \
  -c "SELECT 1 as connection_test;" 2>&1 || echo "Direct connection failed (expected if you're using pooler only)"

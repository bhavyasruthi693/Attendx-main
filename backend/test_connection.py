#!/usr/bin/env python3
"""
Test script to verify Supabase connection and database setup.
Run this locally BEFORE deploying to Render.
"""
import os
import sys
from dotenv import load_dotenv
import socket
import time

load_dotenv()

print("=" * 70)
print("SUPABASE CONNECTION TEST")
print("=" * 70)

# Get connection details
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "postgres")
DATABASE_URL = os.getenv("DATABASE_URL")

print("\n1. Environment Variables Check:")
print(f"   ✓ DB_HOST: {DB_HOST}")
print(f"   ✓ DB_PORT: {DB_PORT}")
print(f"   ✓ DB_USER: {DB_USER[:20]}...")
print(f"   ✓ DB_NAME: {DB_NAME}")
print(f"   ✓ DATABASE_URL: {DATABASE_URL[:50]}...")

# Check if port is correct
if DB_PORT != "5432":
    print(f"\n   ⚠️  WARNING: Port is {DB_PORT}, should be 5432 for Supabase!")

print("\n2. Network Connectivity Check:")
try:
    print(f"   Testing connection to {DB_HOST}:{DB_PORT}...")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(10)
    result = sock.connect_ex((DB_HOST, int(DB_PORT)))
    sock.close()
    
    if result == 0:
        print(f"   ✓ Successfully connected to {DB_HOST}:{DB_PORT}")
    else:
        print(f"   ✗ FAILED to connect to {DB_HOST}:{DB_PORT}")
        print(f"     This means Render ALSO won't be able to connect!")
        print(f"     Check: 1) Supabase IP whitelist")
        print(f"            2) Firewall settings")
        print(f"            3) Network connectivity from your location")
except Exception as e:
    print(f"   ✗ Connection test failed: {str(e)}")

# Test SQLAlchemy connection
print("\n3. Database Connection Test:")
try:
    from sqlalchemy import create_engine, text
    from database import engine
    
    print("   Attempting SQLAlchemy connection...")
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("   ✓ SQLAlchemy connection successful")
        print(f"   ✓ Database query works: {result.fetchone()}")
except Exception as e:
    print(f"   ✗ SQLAlchemy connection failed:")
    print(f"     {str(e)}")
    print("\n   DIAGNOSIS:")
    print("   - Connection timeout? Check Supabase IP whitelist")
    print("   - Authentication failed? Check credentials in .env")
    print("   - Network unreachable? Check firewall/VPN")

print("\n4. Table Creation Test:")
try:
    from database import Base, SessionLocal
    print("   Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("   ✓ Tables created successfully")
    
    # Verify tables exist
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"   ✓ Found {len(tables)} tables: {', '.join(tables)}")
except Exception as e:
    print(f"   ✗ Table creation failed: {str(e)}")

print("\n" + "=" * 70)
print("RECOMMENDATIONS FOR PRODUCTION (RENDER):")
print("=" * 70)
print("""
1. ✓ Use port 5432 (NEVER 6543 - that's wrong!)
2. ✓ Set DATABASE_URL in Render environment
3. ✓ Add Render IPv4 range to Supabase IP whitelist:
   - Render doesn't have fixed IPs
   - Option A: Ask Render support for their IP ranges
   - Option B: Use Supabase PgBouncer (transaction pooling mode)
4. ✓ Add these env vars in Render dashboard:
   - DATABASE_URL=postgresql://...
   - SQLALCHEMY_POOL_SIZE=5
   - SQLALCHEMY_MAX_OVERFLOW=10
   - SQLALCHEMY_CONNECT_TIMEOUT=30
5. ✓ Redeploy and check logs
""")
print("=" * 70)

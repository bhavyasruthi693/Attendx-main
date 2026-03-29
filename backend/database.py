import os
from dotenv import load_dotenv
from urllib.parse import urlparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# environment pieces (may be used to construct full URL)
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = os.getenv("DATABASE_URL")


# Build MySQL SQLAlchemy URL from .env variables
def build_mysql_url():
    if all([DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME]):
        return f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    return None


# Prefer DATABASE_URL from env, else build MySQL URL
normalized = DATABASE_URL or build_mysql_url()
if normalized:
    print(f"DEBUG: Loaded DATABASE_URL: {normalized}")
else:
    normalized = "sqlite:///./attendx.db"
    print("DEBUG: No DB config found — falling back to local SQLite at ./attendx.db")

# Adjust connect args depending on the DB scheme
connect_args = {}
if normalized.startswith("mysql://") or normalized.startswith("mysql+"):
    connect_args = {}
elif normalized.startswith("postgresql://") or normalized.startswith("postgres://"):
    # ...existing code for PostgreSQL...
    try:
        from urllib.parse import urlparse
        parsed_url = urlparse(normalized)
        is_pooler = parsed_url.port == 6543
        connect_timeout = int(os.getenv("SQLALCHEMY_CONNECT_TIMEOUT", "30"))
        if is_pooler:
            connect_args = {
                "connect_timeout": connect_timeout,
                "sslmode": "require",
                "keepalives": 0,
            }
            print("[Database] Using Supabase Connection Pooler (port 6543)")
        else:
            connect_args = {
                "connect_timeout": connect_timeout,
                "sslmode": "require",
                "keepalives": 1,
                "keepalives_idle": 30,
                "keepalives_interval": 10,
                "keepalives_count": 5,
            }
            print("[Database] Using direct PostgreSQL connection (port 5432)")
    except Exception as e:
        print(f"[Database] Warning: Could not parse URL: {e}")
        connect_args = {
            "connect_timeout": 30,
            "sslmode": "require",
        }

# Read pool configuration from environment
pool_size = int(os.getenv("SQLALCHEMY_POOL_SIZE", "5"))
max_overflow = int(os.getenv("SQLALCHEMY_MAX_OVERFLOW", "10"))
pool_recycle = int(os.getenv("SQLALCHEMY_POOL_RECYCLE", "3600"))
pool_pre_ping = os.getenv("SQLALCHEMY_POOL_PRE_PING", "true").lower() == "true"
pool_timeout = int(os.getenv("SQLALCHEMY_POOL_TIMEOUT", "30"))

engine_kwargs = {
    "echo": False,
    "pool_pre_ping": pool_pre_ping,  # Verify connection before use
    "pool_recycle": pool_recycle,  # Recycle connections after 1 hour
    "connect_args": connect_args,
}

# Only apply pool sizing options for non-SQLite backends
if not normalized.startswith("sqlite:"):
    engine_kwargs.update({
        "pool_size": pool_size,
        "max_overflow": max_overflow,
        "pool_timeout": pool_timeout,
    })

engine = create_engine(
    normalized,
    **engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

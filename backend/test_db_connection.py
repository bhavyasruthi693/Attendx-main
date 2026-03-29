import psycopg2
from dotenv import load_dotenv
import os

load_dotenv(override=True)

USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
HOST = os.getenv("DB_HOST")
PORT = os.getenv("DB_PORT")
DBNAME = os.getenv("DB_NAME")

print(f"DEBUG: USER variable is: '{USER}'")
print(f"DEBUG: PASSWORD variable is: '{PASSWORD[:3]}...{PASSWORD[-2:]}'")
print(f"Connecting to {HOST}:{PORT} as {USER}...")

try:
    connection = psycopg2.connect(
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        dbname=DBNAME
    )
    print("Connection successful!")
    
    cursor = connection.cursor()
    cursor.execute("SELECT version();")
    result = cursor.fetchone()
    print("DB Version:", result)

    cursor.close()
    connection.close()

except Exception as e:
    print(f"Failed to connect: {e}")

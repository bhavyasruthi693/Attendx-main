import mysql.connector
import csv 

conn = mysql.connector.connect(
    host = "roundhouse.proxy.rlwy.net",
    user = "root",
    password = "hsLCceaRrjQqKJWMyBwSKWDpGBlMPIix",
    port = 58025,
    database = "railway"
)

cursor = conn.cursor()
cursor.execute("SELECT * FROM attendance")

data  = cursor.fetchall()
columns =[desc[0] for desc in cursor.description]

with open("attendance.csv", 'w',newline="",encoding = "utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(columns)
    writer.writerows(data)

print("Data exported to attendx.csv")

cursor.close()
conn.close()

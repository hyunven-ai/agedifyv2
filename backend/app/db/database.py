from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import os

env_file = Path(__file__).parent.parent.parent / '.env'
if env_file.exists():
    from dotenv import load_dotenv
    load_dotenv(env_file, override=False)

mongo_url = os.environ.get('MONGO_URL', '')
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    socketTimeoutMS=10000,
)
db = client[os.environ.get('DB_NAME', 'mostdomain_db')]

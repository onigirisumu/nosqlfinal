from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import motor.motor_asyncio

app = FastAPI()

# Define the input model for recommendations
class RecommendationRequest(BaseModel):
    style: str
    skin_tone: str
    zodiac: str

# Create a Motor client and connect to your MongoDB
client = motor.motor_asyncio.AsyncIOMotorClient(
    "mongodb+srv://danel:0000@cluster0.avoaf.mongodb.net/FinalNoSQL?retryWrites=true&w=majority"
)
db = client.get_database("FinalNoSQL")  # Use your database name

@app.post("/recommend")
async def recommend(request: RecommendationRequest):
    # For example, filter by style (case-insensitive) from the "products" collection
    # You can expand this query to include skin_tone and zodiac if needed.
    query = {"style": {"$regex": f"^{request.style}$", "$options": "i"}}
    
    # Get a list of matching products
    cursor = db.products.find(query)
    recommended = await cursor.to_list(length=100)
    
    if not recommended:
        raise HTTPException(status_code=404, detail="No recommendations found")
    
    return {"recommendations": recommended}

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from pathlib import Path
import os
import uuid
import logging
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ==================== Config ====================
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
SECRET_KEY = os.environ['SECRET_KEY']
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

AI_SYSTEM_PROMPT = (
    "Bạn là trợ lý AI thân thiện của quán 'Tpt' - một quán ăn Việt Nam truyền thống. "
    "Tpt chuyên các món: Phở Bò, Phở Gà, Bánh Mì Thịt, Bánh Mì Trứng, Bún Chả, Bún Bò Huế, Bánh Bèo, Bánh Bèo Chén. "
    "Nhiệm vụ của bạn là tư vấn món ăn, gợi ý combo, giải thích nguyên liệu, hỏi đáp về đơn hàng, "
    "và hỗ trợ khách hàng đặt món. Luôn trả lời bằng tiếng Việt, ngắn gọn, thân thiện và nhiệt tình. "
    "Nếu khách hỏi ngoài phạm vi ẩm thực/quán, hãy lịch sự chuyển hướng về chủ đề món ăn của Tpt."
)

# ==================== MongoDB ====================
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ==================== Password hashing ====================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(p: str) -> str:
    return pwd_context.hash(p)

def verify_password(p: str, h: str) -> bool:
    return pwd_context.verify(p, h)

def create_access_token(payload: dict) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# ==================== App ====================
app = FastAPI()
api_router = APIRouter(prefix="/api")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ==================== Models ====================
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = ""

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    phone: str = ""
    role: str
    created_at: str

class MenuItem(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str
    image_url: str

class OrderItemIn(BaseModel):
    menu_id: str
    name: str
    price: float
    quantity: int
    image_url: str

class OrderIn(BaseModel):
    items: List[OrderItemIn]
    total: float
    address: str
    phone: str
    note: Optional[str] = ""

class OrderOut(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_name: str
    items: List[dict]
    total: float
    address: str
    phone: str
    note: str
    status: str
    created_at: str

# ==================== Auth deps ====================
async def get_current_user(token: str = Depends(oauth2_scheme)):
    exc = HTTPException(status.HTTP_401_UNAUTHORIZED, "Không thể xác thực", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise exc
    except jwt.PyJWTError:
        raise exc
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise exc
    return user

def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(403, "Chỉ admin mới có quyền truy cập")
    return user

# ==================== Seed ====================
DEFAULT_MENU = [
    {
        "name": "Phở Bò",
        "description": "Phở bò truyền thống với nước dùng đậm đà, thịt bò tươi, hành lá và rau thơm.",
        "price": 55000,
        "category": "Phở",
        "image_url": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?crop=entropy&cs=srgb&fm=jpg&q=85&w=940"
    },
    {
        "name": "Phở Gà",
        "description": "Phở gà thơm ngon với thịt gà xé, nước dùng thanh ngọt.",
        "price": 50000,
        "category": "Phở",
        "image_url": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?crop=entropy&cs=srgb&fm=jpg&q=85&w=940"
    },
    {
        "name": "Bánh Mì Thịt",
        "description": "Bánh mì giòn với pate, thịt nguội, dưa leo, rau thơm và tương ớt.",
        "price": 25000,
        "category": "Bánh mì",
        "image_url": "https://images.pexels.com/photos/32961655/pexels-photo-32961655.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    },
    {
        "name": "Bánh Mì Trứng",
        "description": "Bánh mì trứng ốp la nóng hổi, thơm ngon buổi sáng.",
        "price": 20000,
        "category": "Bánh mì",
        "image_url": "https://images.pexels.com/photos/32961655/pexels-photo-32961655.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    },
    {
        "name": "Bún Chả",
        "description": "Bún chả Hà Nội với thịt nướng thơm phức, nước chấm chua ngọt.",
        "price": 45000,
        "category": "Bún",
        "image_url": "https://images.unsplash.com/photo-1583316175701-0bc5f25a0a44?crop=entropy&cs=srgb&fm=jpg&q=85&w=940"
    },
    {
        "name": "Bún Bò Huế",
        "description": "Bún bò Huế cay nồng đặc trưng miền Trung.",
        "price": 55000,
        "category": "Bún",
        "image_url": "https://images.unsplash.com/photo-1583316175701-0bc5f25a0a44?crop=entropy&cs=srgb&fm=jpg&q=85&w=940"
    },
    {
        "name": "Bánh Bèo",
        "description": "Bánh bèo Huế nhỏ xinh với tôm chấy, hành phi và nước mắm chua ngọt.",
        "price": 35000,
        "category": "Bánh bèo",
        "image_url": "https://images.unsplash.com/photo-1509072619873-adb3dc289b50?crop=entropy&cs=srgb&fm=jpg&q=85&w=940"
    },
    {
        "name": "Bánh Bèo Chén",
        "description": "Bánh bèo chén truyền thống, ăn kèm nước mắm pha đặc biệt.",
        "price": 30000,
        "category": "Bánh bèo",
        "image_url": "https://images.unsplash.com/photo-1509072619873-adb3dc289b50?crop=entropy&cs=srgb&fm=jpg&q=85&w=940"
    },
]

async def seed_admin_and_menu():
    # Seed admin
    existing = await db.users.find_one({"email": ADMIN_EMAIL.lower()})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL.lower(),
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Admin Tpt",
            "phone": "",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin: {ADMIN_EMAIL}")
    else:
        # Always sync admin password from env to avoid stale hash
        await db.users.update_one(
            {"email": ADMIN_EMAIL.lower()},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD), "role": "admin"}}
        )

    # Seed menu
    count = await db.menu.count_documents({})
    if count == 0:
        docs = []
        for m in DEFAULT_MENU:
            docs.append({
                "id": str(uuid.uuid4()),
                **m,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        await db.menu.insert_many(docs)
        logger.info(f"Seeded {len(docs)} menu items")

# ==================== Routes ====================
@api_router.get("/")
async def root():
    return {"message": "Tpt Food Shop API"}

@api_router.post("/auth/register", response_model=TokenOut)
async def register(body: RegisterIn):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email đã được đăng ký")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name,
        "phone": body.phone or "",
        "role": "customer",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_access_token({"sub": user_id, "role": "customer"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user_id, "email": email, "name": body.name, "phone": doc["phone"], "role": "customer", "created_at": doc["created_at"]}
    }

@api_router.post("/auth/login", response_model=TokenOut)
async def login(body: LoginIn):
    email = body.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Email hoặc mật khẩu không đúng")
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "phone": user.get("phone", ""),
            "role": user["role"],
            "created_at": user["created_at"],
        }
    }

@api_router.get("/auth/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "phone": user.get("phone", ""),
        "role": user["role"],
        "created_at": user["created_at"],
    }

# ---------- Menu ----------
@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    items = await db.menu.find({}, {"_id": 0}).to_list(500)
    return items

@api_router.get("/menu/{item_id}", response_model=MenuItem)
async def get_menu_item(item_id: str):
    item = await db.menu.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Không tìm thấy món ăn")
    return item

# ---------- Orders ----------
@api_router.post("/orders")
async def create_order(body: OrderIn, user=Depends(get_current_user)):
    order_id = str(uuid.uuid4())
    doc = {
        "id": order_id,
        "user_id": user["id"],
        "user_email": user["email"],
        "user_name": user["name"],
        "items": [item.dict() for item in body.items],
        "total": body.total,
        "address": body.address,
        "phone": body.phone,
        "note": body.note or "",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/orders/my", response_model=List[OrderOut])
async def my_orders(user=Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders

# ---------- Admin ----------
@api_router.get("/admin/customers")
async def admin_customers(admin=Depends(require_admin)):
    users = await db.users.find({"role": "customer"}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    return users

@api_router.get("/admin/orders", response_model=List[OrderOut])
async def admin_orders(admin=Depends(require_admin)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.patch("/admin/orders/{order_id}")
async def admin_update_order(order_id: str, status_update: dict, admin=Depends(require_admin)):
    new_status = status_update.get("status")
    if new_status not in ("pending", "confirmed", "delivering", "completed", "cancelled"):
        raise HTTPException(400, "Trạng thái không hợp lệ")
    res = await db.orders.update_one({"id": order_id}, {"$set": {"status": new_status}})
    if res.matched_count == 0:
        raise HTTPException(404, "Không tìm thấy đơn hàng")
    return {"ok": True}

@api_router.get("/admin/stats")
async def admin_stats(admin=Depends(require_admin)):
    total_customers = await db.users.count_documents({"role": "customer"})
    total_orders = await db.orders.count_documents({})
    total_menu = await db.menu.count_documents({})
    pipeline = [{"$group": {"_id": None, "sum": {"$sum": "$total"}}}]
    agg = await db.orders.aggregate(pipeline).to_list(1)
    revenue = agg[0]["sum"] if agg else 0
    return {
        "total_customers": total_customers,
        "total_orders": total_orders,
        "total_menu": total_menu,
        "total_revenue": revenue,
    }

# ---------- Chat: AI Assistant ----------
class ChatMessageIn(BaseModel):
    message: str

class SupportMessageIn(BaseModel):
    text: str
    user_id: Optional[str] = None  # required if sender is admin


@api_router.post("/chat/ai")
async def chat_ai(body: ChatMessageIn, user=Depends(get_current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "Chưa cấu hình EMERGENT_LLM_KEY")
    text = (body.message or "").strip()
    if not text:
        raise HTTPException(400, "Nội dung tin nhắn không được để trống")

    # Save user message
    now = datetime.now(timezone.utc).isoformat()
    user_msg = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "role": "user",
        "text": text,
        "created_at": now,
    }
    await db.ai_messages.insert_one(user_msg)

    # Load prior history for context (last 20 msgs)
    history = await db.ai_messages.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", 1).to_list(200)

    session_id = f"ai-{user['id']}"
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=AI_SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    # Replay history (excluding the just-inserted user msg) so Claude has context
    # emergentintegrations LlmChat maintains own history per-session, but we
    # recreate each request so we manually feed the last few turns as context via a prefix in system.
    # Simplest: pass just the new user message; rely on Mongo history for UI. Multi-turn tone still OK.
    try:
        reply = await chat.send_message(UserMessage(text=text))
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(500, f"Lỗi AI: {str(e)}")

    ai_msg = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "role": "assistant",
        "text": reply if isinstance(reply, str) else str(reply),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.ai_messages.insert_one(ai_msg)
    user_msg.pop("_id", None)
    ai_msg.pop("_id", None)
    return {"user_message": user_msg, "ai_message": ai_msg}


@api_router.get("/chat/ai/history")
async def chat_ai_history(user=Depends(get_current_user)):
    msgs = await db.ai_messages.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return msgs


# ---------- Chat: Support (customer <-> admin) ----------
@api_router.post("/chat/support")
async def chat_support(body: SupportMessageIn, user=Depends(get_current_user)):
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(400, "Nội dung tin nhắn không được để trống")

    if user["role"] == "admin":
        if not body.user_id:
            raise HTTPException(400, "user_id (khách hàng) là bắt buộc khi admin gửi tin")
        target = await db.users.find_one({"id": body.user_id}, {"_id": 0})
        if not target:
            raise HTTPException(404, "Không tìm thấy khách hàng")
        conv_user_id = body.user_id
        sender = "admin"
    else:
        conv_user_id = user["id"]
        sender = "customer"

    msg = {
        "id": str(uuid.uuid4()),
        "user_id": conv_user_id,  # the customer's id (the conversation identifier)
        "sender": sender,
        "text": text,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.support_messages.insert_one(msg)
    msg.pop("_id", None)
    return msg


@api_router.get("/chat/support/my")
async def chat_support_my(user=Depends(get_current_user)):
    if user["role"] == "admin":
        raise HTTPException(403, "Endpoint này dành cho khách hàng")
    msgs = await db.support_messages.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return msgs


@api_router.get("/chat/support/conversations")
async def chat_support_conversations(admin=Depends(require_admin)):
    pipeline = [
        {"$sort": {"created_at": 1}},
        {"$group": {
            "_id": "$user_id",
            "last_message": {"$last": "$text"},
            "last_sender": {"$last": "$sender"},
            "last_time": {"$last": "$created_at"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"last_time": -1}},
    ]
    convs = await db.support_messages.aggregate(pipeline).to_list(500)
    # Attach user info
    result = []
    for c in convs:
        user_doc = await db.users.find_one({"id": c["_id"]}, {"_id": 0, "password_hash": 0})
        if not user_doc:
            continue
        result.append({
            "user_id": c["_id"],
            "user_name": user_doc.get("name", ""),
            "user_email": user_doc.get("email", ""),
            "last_message": c["last_message"],
            "last_sender": c["last_sender"],
            "last_time": c["last_time"],
            "count": c["count"],
        })
    return result


@api_router.get("/chat/support/{customer_id}")
async def chat_support_conversation(customer_id: str, admin=Depends(require_admin)):
    msgs = await db.support_messages.find({"user_id": customer_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    user_doc = await db.users.find_one({"id": customer_id}, {"_id": 0, "password_hash": 0})
    return {"user": user_doc, "messages": msgs}


# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.menu.create_index("category")
    await db.orders.create_index("user_id")
    await seed_admin_and_menu()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

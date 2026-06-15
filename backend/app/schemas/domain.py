from typing import Literal

from pydantic import BaseModel, Field


class Review(BaseModel):
    id: str
    name: str
    rating: int
    text: str
    date: str


class DishNutrition(BaseModel):
    calories: int
    protein: str
    carbs: str
    fat: str


class Dish(BaseModel):
    id: str
    name: str
    description: str
    price: int
    image: str
    category: Literal["main", "starter", "drink", "dessert"]
    rating: float
    ingredients: list[str] = Field(default_factory=list)
    instructions: list[str] = Field(default_factory=list)
    isAvailable: bool = True
    nutrition: DishNutrition | None = None
    reviews: list[Review] = Field(default_factory=list)


class OrderItem(BaseModel):
    dishId: str
    name: str
    price: int
    quantity: int


class Order(BaseModel):
    id: str
    items: list[OrderItem]
    total: int
    customerName: str
    phoneNumber: str
    customerEmail: str = ""
    address: str = ""
    deliveryType: Literal["delivery", "dine_in"]
    trackingStatus: Literal["pending", "preparing", "shipping", "delivered", "cancelled"]
    paymentMethod: Literal["cash", "momo", "zalopay"]
    paymentStatus: Literal["unpaid", "paid"]
    createdAt: str
    driverLocation: dict[str, float] | None = None
    manualDriverStep: int | None = None
    callStatus: Literal["idle", "calling", "ringing", "answered", "confirmed", "cancelled", "failed", "no-answer"] | None = "idle"
    callSid: str | None = None
    callLog: list[str] = Field(default_factory=list)


class Reservation(BaseModel):
    id: str
    customerName: str
    phoneNumber: str
    customerEmail: str = ""
    numberOfGuests: int
    reservationTime: str
    tableNumber: int
    sittingArea: str | None = None
    status: Literal["confirmed", "cancelled"]
    createdAt: str


class UserPreferences(BaseModel):
    dietaryNotes: str = ""
    favorites: list[str] = Field(default_factory=list)


class AppUser(BaseModel):
    username: str
    password: str
    fullName: str
    phoneNumber: str
    address: str = ""
    role: Literal["customer", "restaurant", "shipper"]
    avatar: str = "US"
    provider: Literal["local", "google", "facebook"] = "local"
    email: str = ""


class ChatMessage(BaseModel):
    id: str | None = None
    sender: Literal["user", "assistant", "system"]
    text: str
    timestamp: str | None = None


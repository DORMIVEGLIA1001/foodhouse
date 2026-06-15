from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.domain import ChatMessage


class ReviewCreateRequest(BaseModel):
    name: str
    rating: int
    text: str


class DishStockUpdateRequest(BaseModel):
    dishId: str
    isAvailable: bool


class DishCreateRequest(BaseModel):
    name: str
    price: int
    category: Literal["main", "starter", "drink", "dessert"]
    description: str
    image: str


class OrderCreateItemRequest(BaseModel):
    dishId: str
    quantity: int
    name: str | None = None
    price: int | None = None


class OrderCreateRequest(BaseModel):
    items: list[OrderCreateItemRequest]
    customerName: str
    phoneNumber: str
    address: str = ""
    deliveryType: Literal["delivery", "dine_in"] = "delivery"
    paymentMethod: Literal["cash", "momo", "zalopay"] = "cash"
    discount: int | float = 0
    customerEmail: str = ""


class OrderPaymentRequest(BaseModel):
    orderId: str
    paymentMethod: Literal["cash", "momo", "zalopay"] = "cash"


class OrderCancelRequest(BaseModel):
    orderId: str


class OrderStatusUpdateRequest(BaseModel):
    orderId: str
    trackingStatus: str | None = None
    paymentStatus: str | None = None
    manualDriverStep: int | None = None


class ReservationCreateRequest(BaseModel):
    customerName: str
    phoneNumber: str
    customerEmail: str = ""
    numberOfGuests: int
    reservationTime: str
    sittingArea: str | None = None


class ReservationCancelRequest(BaseModel):
    id: str


class PreferencesUpdateRequest(BaseModel):
    dietaryNotes: str | None = None
    favorites: list[str] | None = None


class EmailSendRequest(BaseModel):
    to: str
    subject: str
    html: str


class OtpSendRequest(BaseModel):
    phoneNumber: str


class OtpVerifyRequest(BaseModel):
    phoneNumber: str
    otp: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    fullName: str
    phoneNumber: str
    address: str = ""
    role: Literal["customer", "restaurant", "shipper"]


class LoginRequest(BaseModel):
    username: str
    password: str


class FacebookLoginRequest(BaseModel):
    accessToken: str


class ChatContext(BaseModel):
    customerName: str = ""
    phoneNumber: str = ""
    customerEmail: str = ""
    address: str = ""
    deliveryType: Literal["delivery", "dine_in"] = "delivery"
    paymentMethod: Literal["cash", "momo", "zalopay"] = "cash"


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: ChatContext | None = None


class PhoneTriggerRequest(BaseModel):
    orderId: str
    phoneNumber: str
    customerName: str | None = None
    simulated: bool = True


class PhoneSmsRequest(BaseModel):
    toPhoneNumber: str
    bodyText: str


class PhoneSimulateActionRequest(BaseModel):
    orderId: str
    action: str


class PhoneSimulationFlowRequest(BaseModel):
    currentText: str
    step: int = 1
    orderDetail: str = ""


class LivekitTokenRequest(BaseModel):
    roomName: str
    identity: str


class PaymentCreateRequest(BaseModel):
    orderId: str
    amount: int
    returnUrl: str | None = None


class GenericResponse(BaseModel):
    success: bool = True
    message: str = ""
    data: dict[str, Any] | None = None

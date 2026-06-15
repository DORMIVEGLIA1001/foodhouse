from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.agents.langchain_agent import restaurant_agent
from app.schemas.requests import (
    ChatRequest,
    DishCreateRequest,
    DishStockUpdateRequest,
    EmailSendRequest,
    FacebookLoginRequest,
    LivekitTokenRequest,
    LoginRequest,
    OrderCancelRequest,
    OrderCreateRequest,
    OrderPaymentRequest,
    OrderStatusUpdateRequest,
    OtpSendRequest,
    OtpVerifyRequest,
    PaymentCreateRequest,
    PhoneSimulateActionRequest,
    PhoneSimulationFlowRequest,
    PhoneSmsRequest,
    PhoneTriggerRequest,
    PreferencesUpdateRequest,
    RegisterRequest,
    ReservationCancelRequest,
    ReservationCreateRequest,
    ReviewCreateRequest,
)
from app.services.auth_service import auth_service
from app.services.db_service import db_service
from app.services.dish_service import dish_service
from app.services.driver_service import driver_service
from app.services.email_service import email_service
from app.services.livekit_service import livekit_service
from app.services.order_service import order_service
from app.services.payment_service import payment_service
from app.services.phone_service import phone_service
from app.services.preferences_service import preferences_service
from app.services.reservation_service import reservation_service


router = APIRouter(prefix="/api", tags=["public"])


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.get("/public-config")
async def public_config() -> dict:
    return {
        "googleClientId": auth_service.settings.google_client_id,
        "facebookClientId": auth_service.settings.facebook_client_id,
        "appUrl": auth_service.settings.app_url,
        "facebookLoginImplemented": True,
    }


@router.get("/dishes")
async def list_dishes() -> list[dict]:
    return dish_service.list_dishes()


@router.post("/dishes/{dish_id}/reviews")
async def add_review(dish_id: str, payload: ReviewCreateRequest) -> dict:
    try:
        dish = dish_service.add_review(dish_id, payload.name, payload.rating, payload.text)
        return {"success": True, "dish": dish}
    except ValueError as exc:
        return JSONResponse(status_code=404, content={"success": False, "error": str(exc)})


@router.post("/dishes/update-stock")
async def update_stock(payload: DishStockUpdateRequest) -> dict:
    try:
        dish = dish_service.update_stock(payload.dishId, payload.isAvailable)
        return {"success": True, "dish": dish}
    except ValueError as exc:
        return JSONResponse(status_code=404, content={"success": False, "error": str(exc)})


@router.post("/dishes/add")
async def create_dish(payload: DishCreateRequest) -> dict:
    dish = dish_service.add_dish(payload.model_dump())
    return {"success": True, "dish": dish}


@router.put("/dishes/{dish_id}")
async def update_dish(dish_id: str, payload: DishCreateRequest) -> dict:
    try:
        dish = dish_service.update_dish(dish_id, payload.model_dump())
        return {"success": True, "dish": dish}
    except ValueError as exc:
        return JSONResponse(status_code=404, content={"success": False, "error": str(exc)})


@router.delete("/dishes/{dish_id}")
async def delete_dish(dish_id: str) -> dict:
    try:
        dish_service.delete_dish(dish_id)
        return {"success": True}
    except ValueError as exc:
        return JSONResponse(status_code=404, content={"success": False, "error": str(exc)})


@router.get("/orders")
async def list_orders() -> list[dict]:
    return order_service.list_orders()


@router.post("/orders")
async def create_order(payload: OrderCreateRequest) -> dict:
    try:
        order = await order_service.create_order(payload.model_dump())
        return {"success": True, "order": order}
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"success": False, "error": str(exc)})


@router.post("/orders/pay")
async def pay_order(payload: OrderPaymentRequest) -> dict:
    try:
        order = order_service.pay_order(payload.orderId, payload.paymentMethod)
        return {"success": True, "order": order}
    except ValueError as exc:
        return JSONResponse(status_code=404, content={"success": False, "error": str(exc)})


@router.post("/orders/cancel")
async def cancel_order(payload: OrderCancelRequest) -> dict:
    try:
        order = order_service.cancel_order(payload.orderId)
        return {"success": True, "order": order}
    except ValueError as exc:
        return JSONResponse(status_code=404, content={"success": False, "error": str(exc)})


@router.post("/orders/update-status")
async def update_order_status(payload: OrderStatusUpdateRequest) -> dict:
    try:
        order = await order_service.update_status(
            payload.orderId,
            payload.trackingStatus,
            payload.paymentStatus,
            payload.manualDriverStep,
        )
        return {"success": True, "order": order}
    except ValueError as exc:
        return JSONResponse(status_code=404, content={"success": False, "error": str(exc)})


@router.get("/reservations")
async def list_reservations() -> list[dict]:
    return reservation_service.list_reservations()


@router.post("/reservations")
async def create_reservation(payload: ReservationCreateRequest) -> dict:
    reservation = await reservation_service.create_reservation(payload.model_dump())
    return {"success": True, "reservation": reservation}


@router.post("/reservations/cancel")
async def cancel_reservation(payload: ReservationCancelRequest) -> dict:
    try:
        reservation = reservation_service.cancel_reservation(payload.id)
        return {"success": True, "reservation": reservation}
    except ValueError as exc:
        return JSONResponse(status_code=404, content={"success": False, "error": str(exc)})


@router.get("/preferences")
async def get_preferences() -> dict:
    return preferences_service.get_preferences()


@router.post("/preferences")
async def update_preferences(payload: PreferencesUpdateRequest) -> dict:
    preferences = preferences_service.update_preferences(payload.dietaryNotes, payload.favorites)
    return {"success": True, "preferences": preferences}


@router.get("/check-db")
async def check_db() -> dict:
    return await db_service.check()


@router.get("/emails/history")
async def email_history() -> list[dict]:
    return email_service.history()


@router.post("/emails/send")
async def send_email(payload: EmailSendRequest) -> dict:
    entry = await email_service.send_email(payload.to, payload.subject, payload.html)
    return {"success": entry.get("success", True), "id": entry["id"], "entry": entry}


@router.post("/auth/send-otp")
async def send_otp(payload: OtpSendRequest) -> dict:
    return await auth_service.send_otp(payload.phoneNumber)


@router.post("/auth/verify-otp")
async def verify_otp(payload: OtpVerifyRequest) -> dict:
    try:
        return auth_service.verify_otp(payload.phoneNumber, payload.otp)
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"success": False, "error": str(exc)})


@router.post("/auth/register")
async def register(payload: RegisterRequest) -> dict:
    try:
        return await auth_service.register(payload.model_dump())
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"success": False, "error": str(exc)})


@router.post("/auth/login")
async def login(payload: LoginRequest) -> dict:
    try:
        return await auth_service.login(payload.username, payload.password)
    except ValueError as exc:
        return JSONResponse(status_code=401, content={"success": False, "error": str(exc)})


@router.post("/auth/facebook")
async def facebook_login(payload: FacebookLoginRequest) -> dict:
    try:
        return await auth_service.login_with_facebook(payload.accessToken)
    except ValueError as exc:
        return JSONResponse(status_code=401, content={"success": False, "error": str(exc)})


@router.get("/driver-map/{order_id}")
async def driver_map(order_id: str) -> dict:
    try:
        return driver_service.get_driver_map(order_id)
    except ValueError as exc:
        return JSONResponse(status_code=404, content={"success": False, "error": str(exc)})


@router.post("/chat")
async def chat(payload: ChatRequest) -> dict:
    result = await restaurant_agent.reply(
        [message.model_dump() for message in payload.messages],
        payload.context.model_dump() if payload.context else None,
    )
    return {"success": True, **result}


@router.get("/phone-call/debug-twilio")
async def debug_twilio() -> dict:
    return phone_service.debug_twilio()


@router.post("/phone-call/trigger")
async def trigger_call(payload: PhoneTriggerRequest) -> dict:
    try:
        return await phone_service.trigger_call(payload.orderId, payload.phoneNumber, payload.customerName)
    except ValueError as exc:
        return JSONResponse(status_code=404, content={"success": False, "error": str(exc)})


@router.post("/phone-call/gather")
async def gather_phone() -> dict:
    return {"success": True, "message": "Endpoint gather duoc giu lai de tuong thich Twilio callback."}


@router.post("/phone-call/status-callback")
async def phone_status_callback() -> dict:
    return {"success": True}


@router.post("/phone-call/simulate-action")
async def simulate_phone_action(payload: PhoneSimulateActionRequest) -> dict:
    try:
        return phone_service.simulate_action(payload.orderId, payload.action)
    except ValueError as exc:
        return JSONResponse(status_code=404, content={"success": False, "error": str(exc)})


@router.post("/phone-call/sms")
async def send_sms(payload: PhoneSmsRequest) -> dict:
    return await phone_service.send_sms(payload.toPhoneNumber, payload.bodyText)


@router.post("/phone-simulation/flow")
async def phone_simulation_flow(payload: PhoneSimulationFlowRequest) -> dict:
    return phone_service.simulation_reply(payload.currentText, payload.step, payload.orderDetail)


@router.post("/livekit/token")
async def create_livekit_token(payload: LivekitTokenRequest) -> dict:
    try:
        return livekit_service.issue_token(payload.roomName, payload.identity)
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"success": False, "error": str(exc)})


@router.post("/payment/momo/create")
async def create_momo_payment(payload: PaymentCreateRequest) -> dict:
    return payment_service.create_momo(payload.orderId, payload.amount, payload.returnUrl)


@router.post("/payment/zalopay/create")
async def create_zalopay_payment(payload: PaymentCreateRequest) -> dict:
    return payment_service.create_zalopay(payload.orderId, payload.amount)

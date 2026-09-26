from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import (
    accounts,
    area_status_requests,
    areas,
    auth,
    contracts,
    customers,
    inspections,
    invoices,
    prices,
    rental_requests,
    reports,
    transactions,
)

app = FastAPI(title="API Quản lý cho thuê kho quần áo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    await init_db()


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(accounts.router, prefix="/api/accounts", tags=["accounts"])
app.include_router(areas.router, prefix="/api/areas", tags=["areas"])
app.include_router(area_status_requests.router, prefix="/api/area-status-requests", tags=["area-status-requests"])
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])
app.include_router(contracts.router, prefix="/api/contracts", tags=["contracts"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["invoices"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(rental_requests.router, prefix="/api/rental-requests", tags=["rental-requests"])
app.include_router(prices.router, prefix="/api/prices", tags=["prices"])
app.include_router(inspections.router, prefix="/api/inspections", tags=["inspections"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

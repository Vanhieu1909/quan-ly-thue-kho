import asyncio
from datetime import date, datetime

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.database import DOCUMENT_MODELS
from app.models.area import Area, AreaMapPos
from app.models.contract import Contract
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.price import PriceRow
from app.models.rental_request import RentalRequest
from app.models.account import Account
from app.models.warehouse import Warehouse
from app.models.billing_cycle import BillingCycle
from app.models.area_status_request import AreaStatusRequest
from app.security import hash_password


async def seed() -> None:
    client = AsyncIOMotorClient(settings.mongo_uri)
    await init_beanie(database=client[settings.mongo_db], document_models=DOCUMENT_MODELS)

    for model in DOCUMENT_MODELS:
        await model.delete_all()

    warehouse_main = await Warehouse(
        code="WH-MAIN", name="Kho Tân Bình", location="Tân Bình, TP.HCM", total_capacity=2000, status="HoatDong"
    ).insert()

    area_a01 = await Area(
        code="KV-A01", name="Dãy A1", warehouse_id=str(warehouse_main.id), area_m2=100, type="Ke", status="Trong",
        location="Khu kho · dãy trái", map=AreaMapPos(floor=1, row=1, col=1, row_span=2, col_span=2),
    ).insert()
    await Area(
        code="KV-A02", name="Dãy A2", warehouse_id=str(warehouse_main.id), area_m2=80, type="Ke", status="Trong",
        location="Khu kho · dãy trái", map=AreaMapPos(floor=1, row=3, col=1, row_span=2, col_span=2),
    ).insert()
    await Area(
        code="KV-B01", name="Dãy B1", warehouse_id=str(warehouse_main.id), area_m2=60, type="Treo", status="Trong",
        location="Khu kho · dãy giữa trái", map=AreaMapPos(floor=1, row=1, col=4, row_span=2, col_span=2),
    ).insert()
    area_c01 = await Area(
        code="KV-C01", name="Kệ trung tâm 1", warehouse_id=str(warehouse_main.id), area_m2=50, type="KeVIP", status="Trong",
        location="Khu kho · dãy trung tâm", map=AreaMapPos(floor=1, row=1, col=7, row_span=2, col_span=2),
    ).insert()

    customer_luna = await Customer(
        code="KH001", name="Shop Thời Trang Luna", type="DoanhNghiep", phone="0901234567",
        email="luna@shop.vn", tax_code="0101234567", rented_m2=160, debt=0, status="DangThue",
    ).insert()
    customer_giabao = await Customer(
        code="KH002", name="Xưởng may Gia Bảo", type="DoanhNghiep", phone="0912345678",
        email="giabao@may.vn", tax_code="0109876543", rented_m2=50, debt=0, status="DangThue",
    ).insert()

    await Account(
        username="admin", password_hash=hash_password("123456"), name="Hoàng Thu Huyền",
        role="admin", email="admin@thuekho.vn",
    ).insert()
    await Account(
        username="staff", password_hash=hash_password("123456"), name="Lê Văn Hiếu",
        role="staff", email="kho@thuekho.vn",
    ).insert()
    await Account(
        username="ketoan", password_hash=hash_password("123456"), name="Lê Ngọc Ánh",
        role="accountant", email="ketoan@thuekho.vn",
    ).insert()
    await Account(
        username="0901234567", password_hash=hash_password("123456"), name="Shop Thời Trang Luna",
        role="customer", phone="0901234567", email="luna@shop.vn", customer_id=str(customer_luna.id),
    ).insert()

    contract_hd001 = await Contract(
        code="HD001", customer_id=str(customer_luna.id), area_id=str(area_a01.id), area_m2=100,
        start_date=date(2026, 1, 1), end_date=date(2026, 12, 31), unit_price=150000,
        monthly_rent=15000000, service_fee=500000, deposit=30000000, payment_cycle="Thang",
        status="DangHieuLuc",
    ).insert()
    await Contract(
        code="HD003", customer_id=str(customer_giabao.id), area_id=str(area_c01.id), area_m2=50,
        start_date=date(2026, 2, 1), end_date=date(2027, 1, 31), unit_price=250000,
        monthly_rent=12500000, service_fee=600000, deposit=25000000, payment_cycle="Quy",
        status="DangHieuLuc",
    ).insert()

    await Invoice(
        number="HD-2026-081", date=date(2026, 8, 1), customer_id=str(customer_luna.id),
        contract_id=str(contract_hd001.id), period="Tháng 8/2026",
        content="Tiền thuê tháng 8 - KV-A01", amount_before_tax=15500000, vat=1550000,
        total=17050000, due_date=date(2026, 8, 5), status="ChuaThanhToan", paid_amount=0,
    ).insert()

    await BillingCycle(
        contract_id=str(contract_hd001.id), start_date=date(2026, 8, 1), end_date=date(2026, 8, 31), is_billed=True
    ).insert()

    await RentalRequest(
        code="YC001", customer_name="Shop Vintage Hà Nội", phone="0961112233",
        email="vintage@hn.vn", requested_m2=70, preferred_type="Ke",
        start_date=date(2026, 9, 15), end_date=date(2027, 9, 14),
        special_request="Gần cửa, có điều hòa", date=date(2026, 9, 1), status="Moi",
    ).insert()

    await PriceRow(
        type="Ke", unit_price=150000, unit="đồng/m²/tháng", effective_from=date(2026, 1, 1),
        status="DangApDung",
    ).insert()
    await PriceRow(
        type="Treo", unit_price=200000, unit="đồng/m²/tháng", effective_from=date(2026, 1, 1),
        status="DangApDung",
    ).insert()
    await PriceRow(
        type="KeVIP", unit_price=250000, unit="đồng/m²/tháng", effective_from=date(2026, 1, 1),
        status="DangApDung",
    ).insert()



    print("Seed data finished successfully.")
    print("Default accounts (password 123456): admin, staff, ketoan, 0901234567")


if __name__ == "__main__":
    asyncio.run(seed())

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from .config import settings
from .models.area import Area
from .models.contract import Contract
from .models.customer import Customer
from .models.inspection import Inspection
from .models.invoice import Invoice
from .models.price import PriceRow
from .models.rental_request import RentalRequest
from .models.transaction import Transaction
from .models.account import Account
from .models.warehouse import Warehouse
from .models.billing_cycle import BillingCycle
from .models.area_status_request import AreaStatusRequest

DOCUMENT_MODELS = [
    Account,
    Area,
    Customer,
    Contract,
    Invoice,
    Transaction,
    RentalRequest,
    PriceRow,
    Inspection,
    Warehouse,
    BillingCycle,
    AreaStatusRequest,
]


async def init_db() -> None:
    client = AsyncIOMotorClient(settings.mongo_uri)
    await init_beanie(database=client[settings.mongo_db], document_models=DOCUMENT_MODELS)

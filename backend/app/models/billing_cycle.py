from datetime import date

from beanie import Document
from pymongo import ASCENDING, IndexModel

class BillingCycle(Document):
    contract_id: str
    start_date: date
    end_date: date
    is_billed: bool = False

    class Settings:
        name = "billing_cycles"
        indexes = [
            IndexModel([("contract_id", ASCENDING)]),
            IndexModel([("start_date", ASCENDING), ("end_date", ASCENDING)]),
        ]

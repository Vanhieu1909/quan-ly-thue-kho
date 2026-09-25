from typing import Literal

Role = Literal["admin", "staff", "accountant", "customer"]
AreaType = Literal["Ke", "Treo", "KeVIP", "STANDARD", "COLD", "HAZARDOUS"]
AreaStatus = Literal["Trong", "DaThue", "BaoTri"]
ContractStatus = Literal[
    "ChoHieuLuc", "DangHieuLuc", "SapHetHan", "DaGiaHan", "DaKetThuc", "DaHuy"
]
PaymentStatus = Literal["ChuaThanhToan", "ThanhToanMotPhan", "DaThanhToan", "QuaHan"]
RequestStatus = Literal["Moi", "DaTiepNhan", "DaDuyet", "TuChoi"]
CustomerStatus = Literal["DangThue", "NgungThue"]
CustomerType = Literal["CaNhan", "DoanhNghiep"]
PaymentCycle = Literal["Thang", "Quy", "Nam"]
TransactionType = Literal["Thu", "Chi"]
TransactionStatus = Literal["XacNhan", "Huy"]
PriceStatus = Literal["DangApDung", "Ngung"]
WarehouseStatus = Literal["HoatDong", "BaoTri"]

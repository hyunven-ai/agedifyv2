from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class DomainBase(BaseModel):
    domain_name: str
    dr: int = Field(ge=0, le=100)
    da: int = Field(ge=0, le=100)
    pa: int = Field(ge=0, le=100, default=0)
    spam_score: int = Field(ge=0, le=100, default=0)
    backlinks: int = Field(ge=0)
    traffic: int = Field(ge=0)
    age: int = Field(ge=0)
    price: float = Field(ge=0)
    discount_percentage: float = Field(ge=0, le=100, default=0)
    indexed: int = Field(ge=0, default=0)
    language: str = Field(default="")
    tld: str = Field(default="")
    registrar: str = Field(default="")
    status: str = Field(default="available")
    description: Optional[str] = None


class DomainCreate(DomainBase):
    pass


class DomainUpdate(BaseModel):
    domain_name: Optional[str] = None
    dr: Optional[int] = None
    da: Optional[int] = None
    pa: Optional[int] = None
    spam_score: Optional[int] = None
    backlinks: Optional[int] = None
    traffic: Optional[int] = None
    age: Optional[int] = None
    price: Optional[float] = None
    discount_percentage: Optional[float] = None
    indexed: Optional[int] = None
    language: Optional[str] = None
    tld: Optional[str] = None
    registrar: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None


class DomainResponse(DomainBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    slug: str
    created_at: str
    pa: int = 0
    spam_score: int = 0
    discount_percentage: float = 0
    indexed: int = 0
    language: str = ""
    tld: str = ""
    registrar: str = ""


class DashboardStats(BaseModel):
    total_domains: int
    available_domains: int
    sold_domains: int
    total_revenue: float
    total_contacts: int
    pending_contacts: int
    total_blog_posts: int = 0
    published_posts: int = 0

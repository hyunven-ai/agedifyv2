from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional


class FAQItem(BaseModel):
    question: str
    answer: str


class ContentBlock(BaseModel):
    type: str
    content: str
    settings: Optional[dict] = None


class SEOPageBase(BaseModel):
    title: str
    slug: str
    headline: str
    subheadline: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    focus_keyword: Optional[str] = None
    content_blocks: List[dict] = []
    faq_items: List[dict] = []
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    internal_links: List[str] = []
    status: str = Field(default="draft")


class SEOPageCreate(SEOPageBase):
    pass


class SEOPageUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    headline: Optional[str] = None
    subheadline: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    focus_keyword: Optional[str] = None
    content_blocks: Optional[List[dict]] = None
    faq_items: Optional[List[dict]] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    internal_links: Optional[List[str]] = None
    status: Optional[str] = None


class SEOPageResponse(SEOPageBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str
    updated_at: str


class SEOSettingsBase(BaseModel):
    site_title: str = "Agedify - Premium Aged Domains"
    site_description: str = "Marketplace for premium aged and expired domains"
    default_meta_title: str = "{page_title} | Agedify"
    default_meta_description: str = "Find premium aged domains at Agedify"
    og_image: Optional[str] = None
    robots_txt: str = "User-agent: *\nAllow: /\nSitemap: /sitemap.xml"
    canonical_base: str = ""
    google_analytics_id: Optional[str] = None
    facebook_pixel_id: Optional[str] = None
    custom_head_scripts: Optional[str] = None
    custom_body_scripts: Optional[str] = None
    whatsapp_number: Optional[str] = None
    whatsapp_message: Optional[str] = None
    telegram_username: Optional[str] = None
    chat_widget_enabled: bool = True
    chat_widget_position: str = "right"


class SEOSettingsUpdate(BaseModel):
    site_title: Optional[str] = None
    site_description: Optional[str] = None
    default_meta_title: Optional[str] = None
    default_meta_description: Optional[str] = None
    og_image: Optional[str] = None
    robots_txt: Optional[str] = None
    canonical_base: Optional[str] = None
    google_analytics_id: Optional[str] = None
    facebook_pixel_id: Optional[str] = None
    custom_head_scripts: Optional[str] = None
    custom_body_scripts: Optional[str] = None
    whatsapp_number: Optional[str] = None
    whatsapp_message: Optional[str] = None
    telegram_username: Optional[str] = None
    chat_widget_enabled: Optional[bool] = None
    chat_widget_position: Optional[str] = None

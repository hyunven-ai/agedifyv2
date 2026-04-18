from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional


class CategoryBase(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    post_count: int = 0
    created_at: str


class TagBase(BaseModel):
    name: str
    slug: Optional[str] = None


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    post_count: int = 0


class BlogPostBase(BaseModel):
    title: str
    slug: Optional[str] = None
    content: str
    excerpt: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    focus_keyword: Optional[str] = None
    featured_image: Optional[str] = None
    category_id: Optional[str] = None
    tags: List[str] = []
    author: str = "Admin"
    status: str = Field(default="draft")


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    focus_keyword: Optional[str] = None
    featured_image: Optional[str] = None
    category_id: Optional[str] = None
    tags: Optional[List[str]] = None
    author: Optional[str] = None
    status: Optional[str] = None


class BlogPostResponse(BlogPostBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    slug: str
    category: Optional[dict] = None
    published_at: Optional[str] = None
    created_at: str
    updated_at: str

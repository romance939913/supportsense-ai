from pydantic import BaseModel, Field


class AnswerRequest(BaseModel):
    question: str = Field(min_length=3, max_length=2000)
    organization_id: int = Field(gt=0)
    top_k: int = Field(default=5, ge=1, le=10)
    visitor_id: str = Field(min_length=16, max_length=64)


class AnswerSource(BaseModel):
    citation: int
    document_id: int
    filename: str
    page_number: int
    passage: str


class AnswerResponse(BaseModel):
    answer: str
    sources: list[AnswerSource]


from pydantic import BaseModel, Field


class AnswerRequest(BaseModel):
    question: str = Field(min_length=3, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=10)


class AnswerSource(BaseModel):
    citation: int
    filename: str
    page_number: int
    passage: str


class AnswerResponse(BaseModel):
    answer: str
    sources: list[AnswerSource]


from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator


class DocumentCreate(BaseModel):
    filename: str
    storage_path: str


class DocumentResponse(BaseModel):
    id: int
    filename: str
    storage_path: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentUpdate(BaseModel):
    filename: str | None = None
    storage_path: str | None = None

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        if self.filename is None and self.storage_path is None:
            raise ValueError(
                "At least one field must be provided"
            )

        return self
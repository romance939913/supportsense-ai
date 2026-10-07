import boto3
from botocore.exceptions import ClientError

from app.core.config import settings


s3_client = boto3.client(
    "s3",
    region_name=settings.aws_region,
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
)


def upload_file(
    file_bytes: bytes,
    object_key: str,
    content_type: str | None = None,
) -> None:
    extra_args = {}

    if content_type:
        extra_args["ContentType"] = content_type

    try:
        s3_client.put_object(
            Bucket=settings.s3_bucket_name,
            Key=object_key,
            Body=file_bytes,
            **extra_args,
        )
    except ClientError as exc:
        raise RuntimeError(
            "Failed to upload file to S3"
        ) from exc


def delete_file(object_key: str) -> None:
    try:
        s3_client.delete_object(
            Bucket=settings.s3_bucket_name,
            Key=object_key,
        )
    except ClientError as exc:
        raise RuntimeError(
            "Failed to delete file from S3"
        ) from exc

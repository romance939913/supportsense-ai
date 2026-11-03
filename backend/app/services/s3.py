import boto3
from botocore.exceptions import ClientError

from app.core.config import settings


s3_client_config = {
    "region_name": settings.s3_region,
}
if settings.s3_endpoint_url: # Checks if in local dev environment
    s3_client_config.update(
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key_id or "test",
        aws_secret_access_key=settings.s3_secret_access_key or "test",
    )

s3_client = boto3.client("s3", **s3_client_config)


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

def download_file(object_key: str) -> bytes:
    try:
        response = s3_client.get_object(
            Bucket=settings.s3_bucket_name,
            Key=object_key,
        )
        body = response["Body"]

        try:
            return body.read()
        finally:
            body.close()
    except ClientError as exc:
        raise RuntimeError(
            "Failed to download file from S3"
        ) from exc

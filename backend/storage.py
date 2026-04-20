import io
import mimetypes
import os
import uuid
from typing import Optional

from minio import Minio
from minio.error import S3Error

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_PUBLIC_ENDPOINT = os.getenv("MINIO_PUBLIC_ENDPOINT", MINIO_ENDPOINT)
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin123")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "fashion-store-assets")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
MINIO_PUBLIC_SECURE = os.getenv("MINIO_PUBLIC_SECURE", str(MINIO_SECURE)).lower() == "true"

_client: Optional[Minio] = None


def get_storage_client() -> Minio:
    global _client

    if _client is None:
        _client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_SECURE,
        )

    return _client


def ensure_storage_bucket() -> None:
    client = get_storage_client()

    if not client.bucket_exists(MINIO_BUCKET):
        client.make_bucket(MINIO_BUCKET)

    public_policy = f"""
    {{
      "Version": "2012-10-17",
      "Statement": [
        {{
          "Effect": "Allow",
          "Principal": {{"AWS": ["*"]}},
          "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
          "Resource": ["arn:aws:s3:::{MINIO_BUCKET}"]
        }},
        {{
          "Effect": "Allow",
          "Principal": {{"AWS": ["*"]}},
          "Action": ["s3:GetObject"],
          "Resource": ["arn:aws:s3:::{MINIO_BUCKET}/*"]
        }}
      ]
    }}
    """.strip()

    client.set_bucket_policy(MINIO_BUCKET, public_policy)


def build_public_url(object_name: str) -> str:
    scheme = "https" if MINIO_PUBLIC_SECURE else "http"
    return f"{scheme}://{MINIO_PUBLIC_ENDPOINT}/{MINIO_BUCKET}/{object_name}"


def guess_content_type(filename: str, fallback: str = "application/octet-stream") -> str:
    guessed, _ = mimetypes.guess_type(filename)
    return guessed or fallback


def upload_product_image(content: bytes, filename: str, content_type: str = "") -> dict:
    ensure_storage_bucket()
    client = get_storage_client()

    extension = os.path.splitext(filename)[1].lower() or ".bin"
    object_name = f"products/{uuid.uuid4().hex}{extension}"
    detected_content_type = content_type or guess_content_type(filename)

    data = io.BytesIO(content)
    client.put_object(
        MINIO_BUCKET,
        object_name,
        data,
        length=len(content),
        content_type=detected_content_type,
    )

    return {
      "object_name": object_name,
      "url": build_public_url(object_name),
      "content_type": detected_content_type,
      "size": len(content),
    }


def list_product_images(limit: int = 100) -> list[dict]:
    ensure_storage_bucket()
    client = get_storage_client()
    max_items = max(1, min(limit, 500))
    images = []

    for item in client.list_objects(MINIO_BUCKET, prefix="products/", recursive=True):
        object_name = item.object_name or ""
        if not object_name or object_name.endswith("/"):
            continue

        content_type = guess_content_type(object_name)
        if not content_type.startswith("image/"):
            continue

        images.append(
            {
                "object_name": object_name,
                "url": build_public_url(object_name),
                "content_type": content_type,
                "size": item.size or 0,
                "last_modified": item.last_modified,
            }
        )

    images.sort(
        key=lambda image: image["last_modified"].timestamp() if image["last_modified"] else 0,
        reverse=True,
    )
    return images[:max_items]


def delete_product_image(object_name: str) -> dict:
    ensure_storage_bucket()
    client = get_storage_client()
    normalized_name = object_name.strip()

    if not normalized_name.startswith("products/") or normalized_name.endswith("/"):
        raise ValueError("Invalid product image object name")

    client.remove_object(MINIO_BUCKET, normalized_name)
    return {
        "object_name": normalized_name,
        "deleted": True,
    }

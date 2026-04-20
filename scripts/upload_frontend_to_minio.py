#!/usr/bin/env python3
import argparse
import io
import json
import mimetypes
import os
from pathlib import Path

from minio import Minio


DEFAULT_BUCKET = "fashion-store-frontend"


def env_bool(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}


def get_client() -> Minio:
    return Minio(
        os.getenv("MINIO_ENDPOINT", "localhost:9000"),
        access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
        secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin123"),
        secure=env_bool("MINIO_SECURE"),
    )


def public_policy(bucket: str) -> str:
    return json.dumps(
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
                    "Resource": [f"arn:aws:s3:::{bucket}"],
                },
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket}/*"],
                },
            ],
        }
    )


def guess_content_type(path: Path) -> str:
    if path.name == "manifest.webmanifest":
        return "application/manifest+json"
    guessed, _ = mimetypes.guess_type(path.name)
    return guessed or "application/octet-stream"


def ensure_bucket(client: Minio, bucket: str) -> None:
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
    client.set_bucket_policy(bucket, public_policy(bucket))


def clean_bucket(client: Minio, bucket: str) -> int:
    objects = list(client.list_objects(bucket, recursive=True))
    for item in objects:
        if item.object_name:
            client.remove_object(bucket, item.object_name)
    return len(objects)


def upload_dist(client: Minio, bucket: str, dist_dir: Path) -> int:
    files = [path for path in dist_dir.rglob("*") if path.is_file()]
    for path in files:
        object_name = path.relative_to(dist_dir).as_posix()
        content = path.read_bytes()
        client.put_object(
            bucket,
            object_name,
            io.BytesIO(content),
            length=len(content),
            content_type=guess_content_type(path),
        )
    return len(files)


def build_public_url(bucket: str) -> str:
    endpoint = os.getenv("MINIO_PUBLIC_ENDPOINT", os.getenv("MINIO_ENDPOINT", "localhost:9000"))
    scheme = "https" if env_bool("MINIO_SECURE") else "http"
    return f"{scheme}://{endpoint}/{bucket}/index.html"


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload Vite frontend dist to a public MinIO bucket.")
    parser.add_argument("--dist", default="frontend/dist", help="Path to built frontend dist directory.")
    parser.add_argument("--bucket", default=os.getenv("FRONTEND_BUCKET", DEFAULT_BUCKET))
    parser.add_argument("--clean", action="store_true", help="Remove existing objects in the bucket before upload.")
    args = parser.parse_args()

    dist_dir = Path(args.dist).resolve()
    if not dist_dir.is_dir():
        raise SystemExit(f"Missing dist directory: {dist_dir}")
    if not (dist_dir / "index.html").is_file():
        raise SystemExit(f"Missing index.html in dist directory: {dist_dir}")

    client = get_client()
    ensure_bucket(client, args.bucket)
    removed = clean_bucket(client, args.bucket) if args.clean else 0
    uploaded = upload_dist(client, args.bucket, dist_dir)

    print(
        json.dumps(
            {
                "bucket": args.bucket,
                "removed": removed,
                "uploaded": uploaded,
                "url": build_public_url(args.bucket),
            },
            indent=2,
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()

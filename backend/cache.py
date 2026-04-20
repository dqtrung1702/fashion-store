import hashlib
import json
from typing import Any

from redis.exceptions import RedisError

from redis_client import get_ready_redis, mark_redis_unavailable

PRODUCT_CACHE_TTL = 120
PRODUCT_SEARCH_CACHE_TTL = 60
COLLECTION_CACHE_TTL = 600
CATEGORIES_CACHE_TTL = 600
CONTENT_CACHE_TTL = 600


def make_cache_key(namespace: str, payload: dict[str, Any] | None = None) -> str:
    if not payload:
        return f"cache:{namespace}"
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    return f"cache:{namespace}:{digest}"


def get_json_cache(key: str):
    client = get_ready_redis()
    if not client:
        return None

    try:
        raw_value = client.get(key)
    except RedisError as error:
        mark_redis_unavailable(error)
        return None

    if raw_value is None:
        return None

    try:
        return json.loads(raw_value)
    except json.JSONDecodeError:
        return None


def set_json_cache(key: str, value: Any, ttl_seconds: int):
    client = get_ready_redis()
    if not client:
        return

    try:
        client.setex(key, ttl_seconds, json.dumps(value, default=str, separators=(",", ":")))
    except RedisError as error:
        mark_redis_unavailable(error)


def delete_cache_patterns(patterns: list[str]) -> int:
    client = get_ready_redis()
    if not client:
        return 0

    deleted = 0
    try:
        for pattern in patterns:
            batch = []
            for key in client.scan_iter(match=pattern, count=250):
                batch.append(key)
                if len(batch) >= 250:
                    deleted += client.delete(*batch)
                    batch = []
            if batch:
                deleted += client.delete(*batch)
    except RedisError as error:
        mark_redis_unavailable(error)
        return deleted

    return deleted


def invalidate_catalog_cache() -> int:
    return delete_cache_patterns(
        [
            "cache:products:*",
            "cache:collections:*",
            "cache:categories:*",
        ]
    )


def invalidate_content_cache() -> int:
    return delete_cache_patterns(["cache:content:*"])

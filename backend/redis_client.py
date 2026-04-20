import os
import time

from dotenv import load_dotenv
from redis import Redis
from redis.exceptions import RedisError

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CACHE_ENABLED = os.getenv("CACHE_ENABLED", "true").lower() in {"1", "true", "yes", "on"}
REDIS_RETRY_SECONDS = int(os.getenv("REDIS_RETRY_SECONDS", "30"))

_client = None
_available = False
_last_error_at = 0.0


def _can_use_cache() -> bool:
    if not CACHE_ENABLED or not REDIS_URL:
        return False
    if _available:
        return True
    return time.time() - _last_error_at >= REDIS_RETRY_SECONDS


def get_redis():
    global _client
    if not CACHE_ENABLED or not REDIS_URL:
        return None
    if _client is None:
        _client = Redis.from_url(
            REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
    return _client


def mark_redis_unavailable(error: Exception | None = None):
    global _available, _last_error_at
    _available = False
    _last_error_at = time.time()
    if error:
        print(f"Redis cache unavailable: {error}")


def get_ready_redis():
    global _available
    if not _can_use_cache():
        return None

    client = get_redis()
    if not client:
        return None

    if _available:
        return client

    try:
        client.ping()
        _available = True
        print("Redis cache connected")
        return client
    except RedisError as error:
        mark_redis_unavailable(error)
        return None


def connect_redis():
    if not CACHE_ENABLED:
        print("Redis cache disabled")
        return None
    return get_ready_redis()


def close_redis():
    global _client, _available
    if _client:
        _client.close()
    _client = None
    _available = False

import hashlib
import hmac
import json
import logging
from typing import Any

import httpx

from app.models.user import User

logger = logging.getLogger(__name__)


def _sign_payload(secret: str, body: bytes) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def dispatch_webhook(user: User, event_type: str, payload: dict[str, Any]) -> None:
    if not user.webhook_url:
        return

    body = json.dumps({"event": event_type, **payload}).encode()
    headers = {"Content-Type": "application/json"}
    if user.webhook_secret:
        headers["X-SendBeacon-Signature"] = _sign_payload(user.webhook_secret, body)

    try:
        httpx.post(user.webhook_url, content=body, headers=headers, timeout=5.0)
    except httpx.HTTPError:
        logger.exception("Webhook delivery failed for user %s", user.id)

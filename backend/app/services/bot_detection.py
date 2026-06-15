BOT_UA_PATTERNS = (
    "appleprivacy",
    "proxy",
    "bot",
    "crawler",
    "spider",
    "preview",
)


def is_probable_bot(user_agent: str | None, seconds_since_send: float | None = None) -> bool:
    if not user_agent:
        return False
    ua = user_agent.lower()
    if any(pattern in ua for pattern in BOT_UA_PATTERNS):
        return True
    if seconds_since_send is not None and seconds_since_send < 2:
        return True
    return False

from datetime import datetime
from zoneinfo import ZoneInfo


def budapest_now() -> datetime:
    return datetime.now(ZoneInfo("Europe/Budapest")).replace(tzinfo=None)

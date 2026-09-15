import os

import requests
from dotenv import load_dotenv

load_dotenv()


def get_player_mmr(
    apex_username: str,
    platform: str,
) -> int:
    api_key = os.getenv("APEX_API_KEY")

    if not api_key:
        raise RuntimeError("APEX_API_KEY nincs beállítva")

    url = "https://api.mozambiquehe.re/bridge"

    params = {
        "auth": api_key,
        "player": apex_username,
        "platform": platform,
    }

    response = requests.get(
        url,
        params=params,
        timeout=10,
    )

    response.raise_for_status()

    data = response.json()

    return int(data["global"]["rank"]["rankScore"])

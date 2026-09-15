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

    url = "https://api.apexlegendsstatus.com/bridge"
    params = {
        # "auth": "88faca215232d4a093f77c85ab60ea7d",
        "auth": api_key,
        "player": apex_username,
        "platform": platform,
    }

    response = requests.get(
        url,
        params=params,
        timeout=10,
    )

    print("STATUS:", response.status_code)
    print("CONTENT-TYPE:", response.headers.get("content-type"))
    print("RESPONSE:", response.text[:500])

    response.raise_for_status()

    data = response.json()

    return int(data["global"]["rank"]["rankScore"])

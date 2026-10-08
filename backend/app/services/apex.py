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


def get_player_profile(apex_username: str, platform: str) -> dict:
    api_key = os.getenv("APEX_API_KEY")

    if not api_key:
        raise RuntimeError("APEX_API_KEY nincs beállítva")

    url = "https://api.mozambiquehe.re/bridge"

    params = {
        "auth": api_key,
        "player": apex_username,
        "platform": platform,
    }

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()

    data = response.json()
    rank = data["global"]["rank"]
    total = data.get("total", {})

    return {
        "level": data["global"]["level"],
        "to_next_level_percent": data["global"]["toNextLevelPercent"],
        "rank_name": rank["rankName"],
        "rank_div": rank["rankDiv"],
        "rank_score": rank["rankScore"],
        "rank_img": rank["rankImg"],
        "kd": total.get("kd", {}).get("value", "N/A"),
        "career_kills": total.get("career_kills", {}).get("value", 0),
        "career_wins": total.get("career_wins", {}).get("value", 0),
        "games_played": total.get("games_played", {}).get("value", 0),
        "selected_legend": data.get("realtime", {}).get("selectedLegend", "N/A"),
    }


def get_players_mmr() -> dict[str, int]:
    return {
        "patrik": get_player_mmr(
            apex_username="patrickkenway",
            platform="PS4",
        ),
        "noel": get_player_mmr(
            apex_username="TragicSleet364",
            platform="PC",
        ),
    }

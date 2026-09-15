from backend.app.services.apex import get_player_mmr


mmr = get_player_mmr(
    apex_username="patrickkenway",
    platform="PS4",
)
print("asd")
print("MMR:", mmr)

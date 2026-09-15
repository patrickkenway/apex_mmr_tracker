from backend.app.services.apex import get_player_mmr


patrik_mmr = get_player_mmr(
    apex_username="patrickkenway",
    platform="PS4",
)

noel_mmr = get_player_mmr(
    apex_username="TragicSleet364",
    platform="PC",
)

print("Patrik MMR:", patrik_mmr)
print("Noel MMR:", noel_mmr)

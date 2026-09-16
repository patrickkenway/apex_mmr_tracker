from backend.app.services.apex import get_players_mmr


mmr = get_players_mmr()

print("Patrik MMR:", mmr["patrik"])
print("Noel MMR:", mmr["noel"])

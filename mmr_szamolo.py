import requests
import re

# region Data Fetching
url = "https://api.mozambiquehe.re/bridge?auth=88faca215232d4a093f77c85ab60ea7d&player=patrickkenway&platform=PS4"
url_noel = "https://api.mozambiquehe.re/bridge?auth=88faca215232d4a093f77c85ab60ea7d&player=TragicSleet364&platform=PC"
headers = {}

# Patrik data
res = requests.get(url, headers=headers)
data = res.json()
# noel data
res_noel = requests.get(url_noel, headers=headers)
data_noel = res_noel.json()

patrik_mmr = str(res.json()["global"]["rank"]["rankScore"])
noel_mmr = str(res_noel.json()["global"]["rank"]["rankScore"])


# endregion Data Fetching
# region Functions
def row_counter(file_name):
    with open(file_name, "r") as file:
        row_count = 0
        for row in file:
            if row == "\n" or row.__contains__("Nap"):
                continue
            else:
                row_count += 1
        return int(row_count / 2)


def numberFinder(text):
    numbers = re.findall(r"\d+", text)
    return numbers


def nap_vege():
    try:
        with open("pregame_mmr.txt", "r") as file:
            content = file.read()
        return (numberFinder(content)[-3], numberFinder(content)[-1])
    except IndexError:
        print("Nincs elég adat a nap végéhez. Folytasd a napot először.")
        return None


# Meccs előtti mmr rögzítése (egyszeri)
def initial_mmr():
    pre = f"Patrik meccs elotti mmr-je: {patrik_mmr} \n Noel meccs elotti mmr-je: {noel_mmr}\n"
    with open("pregame_mmr.txt", "w") as file:
        file.write(pre)


# Meccsenkenti mmr rögzítése
def next_match_mmr():
    post = f"Patrik {row_counter('pregame_mmr.txt')}. meccs utani mmr-je: {patrik_mmr} \n Noel {row_counter('pregame_mmr.txt')}. meccs utani mmr-je: {noel_mmr}"
    with open("pregame_mmr.txt", "a") as file:
        file.write("\n" + post + "\n")
    print("Meccs utáni MMR rögzítve.")


def progress():
    try:
        with open("pregame_mmr.txt", "r") as file:
            content = file.read()
        patrik_start = int(numberFinder(content)[0])
        noel_start = int(numberFinder(content)[1])
        patrik_end = int(numberFinder(content)[-3])
        noel_end = int(numberFinder(content)[-1])
        patrik_diff = patrik_end - patrik_start
        noel_diff = noel_end - noel_start
        print(
            f"---\nPatrik MMR változása: {patrik_start} --> {patrik_end} diff: {patrik_diff} \n Noel MMR változása: {noel_start} --> {noel_end} diff: {noel_diff}\n---"
        )
    except IndexError:
        print(
            "\nNincs elég adat a progress megjelenitesere. Rögzíts meccs utáni MMR-t először."
        )


# endregion Functions
# region Main Program
try:
    uj_nap = input("\nSzeretnél-e új napot kezdeni? (Y/N): ").lower()
    nap = nap_vege()
    if uj_nap == "y" and nap is not None:
        p, n = nap
        print("Új nap kezdése..., nap vége rögzítése.")
        with open("napok.txt", "a") as file:
            file.write(
                f"\nNap {row_counter('napok.txt') + 1}: \n Patrik zart {p} MMR-rel \n Noel zart {n} MMR-rel \n"
            )
        initial_mmr()
    else:
        print("Folytatjuk a meglévő napot.")
except FileNotFoundError:
    print("Nincs előző nap, új nap kezdése.")
    initial_mmr()

if input("\nSzeretnéd-e rögzíteni a meccs utáni MMR-t? (Y/N): ").lower() == "y":
    next_match_mmr()
else:
    print("Nem rögzítjük az MMR-t.")

progress()
print("\nSikeres futtatás!")
# endregion Main Program

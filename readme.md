[TODO]
Ez a projekt fejlesztés gyakorlásra szolgál, és egyelőre AI segítségével készült.
Itt a segítség leginkább interactive promptolást jelent, nem ő írta meg az
egészet.

A projekt működése egy apin alapszik amiből adatokat kérek le, és ez alapján mmr rekordokat viszek fel egy postgres adatbázisba, ahonnan lekérdezések
segítségével mutatok ki bizonyos adatok, és grafikonokat.

Létezik egy login kezelés része, felhasználókkal is.

Az api alapjául szolgáló legérdezések így néznek ki:

curl "<https://api.mozambiquehe.re/bridge?auth=$APEX_API_KEY&player=patrickkenway&platform=PS4>" | python3 -m json.tool

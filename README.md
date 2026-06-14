# Rinkis aiškiai

Veikiantis kandidatų į Seimą palyginimo MVP. Rinkinyje yra 1 740 realių
2024 m. kandidatų VRK biografijos, anketos ir 2023 m. deklaracijos. Trims
kandidatams papildomai atlikta rankinė teismų ir kitų viešų šaltinių patikra.

## Paleidimas

```powershell
python -m http.server 8000
```

Tada atverkite `http://localhost:8000`.

## VRK duomenų atnaujinimas

```powershell
python scripts\collect_vrk_candidates.py --workers 32
```

Scenarijus atnaujina `data/candidates-2024.json`. Masiniame rinkinyje reputacijos
dalis remiasi privalomais VRK anketos klausimais apie apkaltinamuosius sprendimus
ir mandato netekimą. Tai nėra pilna nepriklausoma reputacijos patikra.

## Numatomi oficialūs šaltiniai

- VRK: kandidatų sąrašai, kandidatų anketos, biografijos ir deklaruojami duomenys.
- VTEK: teisėtai vieši interesų deklaracijų duomenys.
- Lietuvos teismai ir institucijų pranešimai: procesų būsena bei įsiteisėję sprendimai.
- Kandidato pateikti pirminiai dokumentai, kai leidžiama juos teisėtai skelbti.

VRK skelbia kandidatų deklaruotų pajamų ir deklaruotos mokėtinos pajamų mokesčio
sumos išrašus. Finansiniame bale 20% naudojamas kaip mokestinio solidarumo
etalonas, o mažesnis santykis balą mažina kvadratiškai. Tai normatyvinis
reitingavimo pasirinkimas, ne išvada apie mokesčių vengimą.

Viešo patikimumo balas atskiria galutinį sprendimą, pirmosios instancijos
nuosprendį, tyrimą ir paprastą viešą teiginį. Susiję tos pačios veikos procesai
nedubliuojami. Visa formulė ir pilotiniai faktai aprašyti
`data/public-facts-methodology.md`.

Bendro balo svoriai: viešas patikimumas 45%, finansai 25%, patirtis 20%,
išsilavinimas 10%. Patikimumas taip pat riboja galutinį rezultatą: mažiau nei
40 patikimumo balų neleidžia bendram balui viršyti 45.

## Produkcinės versijos apsaugos

- Šaltinio URL, paskelbimo data ir gavimo laikas prie kiekvieno fakto.
- Metodikos versijavimas ir perskaičiavimo audito žurnalas.
- Kandidatų teisė pateikti paaiškinimą bei klaidos taisymo procesas.
- Įtarimų, kaltinimų, vykstančių bylų ir įsiteisėjusių sprendimų atskyrimas.
- Prisijungimas, vieno balso taisyklė ir apsauga nuo koordinuoto balsavimo.
- Administratoriaus peržiūra prieš faktui keičiant eksperto balą.

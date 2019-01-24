# WU CasperJS LPIS API

Eine API für das Lehrveranstaltungs- und Prüfungsinformationssystem (LPIS) der WU Wien "[LPIS](https://www.wu.ac.at/studierende/tools-services/lpis/)" basierend auf JavaScript und CasperJS.

*Es gibt eine neue (bessere) API basierend auf Python. Mehr zur PYthon API unter [wu-lpis-api](https://github.com/alexanderhofstaetter/wu-lpis-api)*.

Die API emuliert einen Browser und navigiert so durch LPIS. Die verschiedenen Endpunkte werden aufgerufen und Formulardaten (die Anmeldung für eine Lehrveranstaltung ist z.B. ein Formular) ausgefüllt und abgesendet. 

Es können Infos über LVs, Abschnitte und einzelne Fächer ausgelesen werden. Außerdem steht die automatische LV Anmeldung zur Verfügung.

## API Aufrufe (Beispiele)

Zuerst muss eine Session initiert werden. Dabei werden Daten und Cookies, welche zum jederzeitigen Fortsetzen der Session benötigt werden, lokal gespeichert.

`casperjs flips.js h01612345 init MeinWUPasswort123`

Danach können beliebige Aktionen durchgeführt werden. Es muss nun nurmehr die Matrikelnummer angegeben werden.

```
casperjs wu-lpis-api.js h01612345 lv-register ASPP          SPP    SPAN               F
casperjs wu-lpis-api.js h01612345 lv-register 125001_362756 125025 SPAN_394146_125025 92
```

Die Parameter `ASPP`, `SPP` und `F` können aus der URL im LPIS abgelesen werden. Der letzte Parameter ist die ID der Form (Anmelden Button) für die jeweilige LV Anmeldung.

```
- ASPP: Abschnitt/Studium Planpunkt
- SPP: Studiumplanpunkt (einzelnes Fach)
- SPAN: Lehrveranstaltungskennung
- F : Fach, Abstufung für den Planpunkt, z.B. ob WiKo Englisch oder Französisch (optional) 
```

# Automatisierung

Mit [wu-lpis-api-start.sh](wu-lpis-api-start.sh) kann die Anmeldung automatisch zu einem gewissen Zeitpunkt durchgeführt werden. Die Session benötigt vorher eine Initialisierung.

# Copyright & License

Copyright (c) 2018-2019 Alexander Hofstätter - Released under the [MIT license](LICENSE.md).
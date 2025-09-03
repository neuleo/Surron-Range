# Sur-Ron Reichweitenrechner

Ein web-basierter Reichweitenrechner für Sur-Ron E-Bikes. Dieses Tool bietet eine einfache Oberfläche zur Schätzung der verbleibenden Reichweite basierend auf dem Akkustand und dem Fahrmodus und enthält einen fortschrittlichen Routenplaner zur Berechnung des Verbrauchs für eine bestimmte Strecke.

![App Screenshot](https://placehold.co/600x300/1f2937/ffffff?text=Sur-Ron+App)

## Features

Das Projekt ist in zwei Hauptansichten unterteilt: einen einfachen Rechner und einen voll funktionsfähigen Routenplaner.

#### Einfacher Reichweitenrechner
- **Akkustand:** Passen Sie den aktuellen Akkustand mit einem Schieberegler und Feinjustierungs-Buttons (+/-) an.
- **Fahrmodi:** Wechseln Sie zwischen "Sport"- und "Eco"-Modus, um die Reichweitenschätzung zu ändern.
- **Leistungsdrossel:** Ein Schalter zur Simulation einer auf 90% begrenzten nutzbaren Akkukapazität.
- **Persistenz:** Die App merkt sich Ihre letzten Einstellungen (Akku, Modus, Drossel) im Browser.

#### Fortschrittlicher Routenplaner
- **Multi-Stop-Routen:** Planen Sie eine Reise mit einem Startpunkt, einem Endpunkt und beliebig vielen Zwischenstopps.
- **Drag & Drop:** Ordnen Sie die Haltepunkte einfach per Drag & Drop mit einem dedizierten Griff neu an. Eine kurze Halteverzögerung auf Mobilgeräten verhindert versehentliches Verschieben.
- **Detaillierte Berechnungen:** Erhalten Sie eine Etappen-genaue Aufschlüsselung der Reise, die die verbleibende Akkuladung bei Ankunft an jedem Stopp anzeigt.
- **Rückweg:** Berechnet automatisch die direkte Rückfahrt vom letzten zum ersten Punkt und zeigt die endgültige verbleibende Akkuladung an (wird bei Rundreisen ausgeblendet).

#### Standort-Features
- **Leistungsstarke Suche:** Suchen Sie nach Adressen, Firmennamen oder Sehenswürdigkeiten (POIs).
- **Koordinaten-Eingabe:** Fügen Sie GPS-Koordinaten direkt in die Eingabefelder ein.
- **Aktueller Standort:** Verwenden Sie den aktuellen GPS-Standort Ihres Geräts als Startpunkt.
- **Favoriten speichern:** Speichern Sie jeden beliebigen Ort mit einem benutzerdefinierten Namen (z.B. "Zuhause", "Arbeit").
- **Favoriten verwalten:** Eine eigene Seite zur Verwaltung Ihrer Favoriten, auf der Sie diese neu anordnen oder löschen können.

## Tech Stack

- **Frontend:** HTML5, Tailwind CSS (via CDN), Vanilla JavaScript (ES6+)
- **Karten:** [Leaflet.js](https://leafletjs.com/)
- **Routing & Geocoding:** [OpenRouteService API](https://openrouteservice.org/)
- **Drag & Drop:** [SortableJS](https://github.com/SortableJS/Sortable)
- **Deployment:** [Docker](https://www.docker.com/) & [Nginx](https://www.nginx.com/)

## Setup & Verwendung

Dieses Projekt ist vollständig containerisiert und einfach auszuführen.

### Voraussetzungen
- [Docker](https://docs.docker.com/get-docker/) muss installiert sein.

### Ausführen der Anwendung

1.  **Bauen Sie das Docker-Image:**
    ```bash
    docker build -t sur-ron-range .
    ```

2.  **Starten Sie den Docker-Container:**
    ```bash
    docker run -d -p 8080:80 --name sur-ron-app sur-ron-range
    ```

3.  **Öffnen Sie die App:**
    Die Anwendung ist nun in Ihrem Browser unter [http://localhost:8080](http://localhost:8080) verfügbar.

### Convenience Script

Für eine einfachere Handhabung können Sie das mitgelieferte Skript `rebuild.sh` verwenden, das die `down`- und `up`-Befehle von Docker Compose kombiniert, um die Anwendung neu zu erstellen und zu starten.

```bash
./rebuild.sh
```
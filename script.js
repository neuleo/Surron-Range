// ===== API Keys & Constants =====
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImIzNTk3Mjc5MTZmNTQyZTdiNWI2MmMxOTJkZDMxNDQ0IiwiaCI6Im11cm11cjY0In0=';
const sportKmPerPercent = 26.4 / 59;
const ecoFactor = 1.75;
const ecoKmPerPercent = sportKmPerPercent * ecoFactor;

// ===== Global State =====
let map, routeLayer, sortable, favoritesSortable;
let waypoints = [ { label: '', coords: null }, { label: '', coords: null } ];
let placeToSave = {};

// ===== Utility & localStorage Functions =====
const debounce = (func, delay) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; };
function getSavedPlaces() { const places = localStorage.getItem('surRonSavedPlaces'); return places ? JSON.parse(places) : []; }
function setSavedPlaces(places) { localStorage.setItem('surRonSavedPlaces', JSON.stringify(places)); }

// ===== MAIN SCRIPT - WAITS FOR FULL PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    // ===== DOM Elements =====
    const batterySlider = document.getElementById('battery-slider');
    const batteryLevelDisplay = document.getElementById('battery-level-display');
    const rangeOutput = document.getElementById('range-output');
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const capacityToggle = document.getElementById('capacity-toggle');
    const plusBtn = document.getElementById('plus-btn');
    const minusBtn = document.getElementById('minus-btn');
    const menuButton = document.getElementById('menu-button');
    const menuIconOpen = document.getElementById('menu-icon-open');
    const menuIconClose = document.getElementById('menu-icon-close');
    const calculatorPage = document.getElementById('calculator-page');
    const routePage = document.getElementById('route-page');
    const favoritesPage = document.getElementById('favorites-page');
    const saveFavoritePage = document.getElementById('save-favorite-page');
    const calculateRouteBtn = document.getElementById('calculate-route-btn');
    const stopsContainer = document.getElementById('stops-container');
    const addStopBtn = document.getElementById('add-stop-btn');
    const routeResults = document.getElementById('route-results');
    const savePlaceLabel = document.getElementById('save-place-label');
    const placeNameInput = document.getElementById('place-name-input');
    const cancelSaveBtn = document.getElementById('cancel-save-btn');
    const confirmSaveBtn = document.getElementById('confirm-save-btn');
    const manageFavoritesBtn = document.getElementById('manage-favorites-btn');
    const backToRouteBtn = document.getElementById('back-to-route-btn');
    const favoritesListContainer = document.getElementById('favorites-list-container');

    // ===== Page Navigation & Rendering =====
    function showPage(pageToShow) { [calculatorPage, routePage, favoritesPage, saveFavoritePage].forEach(p => p.classList.add('hidden')); pageToShow.classList.remove('hidden'); }

    // ===== State Management =====
    function saveState() { const state = { battery: batterySlider.value, mode: document.querySelector('input[name="mode"]:checked').value, throttled: capacityToggle.checked }; localStorage.setItem('surRonRangeState', JSON.stringify(state)); }
    function loadState() { const savedState = localStorage.getItem('surRonRangeState'); if (savedState) { const state = JSON.parse(savedState); batterySlider.value = state.battery; capacityToggle.checked = state.throttled; document.querySelector(`input[name="mode"][value="${state.mode}"]`).checked = true; } }

    function openSavePlacePage(label, coords) { placeToSave = { label, coords }; savePlaceLabel.textContent = label; placeNameInput.value = ''; showPage(saveFavoritePage); placeNameInput.focus(); }
    function confirmSavePlace() { const name = placeNameInput.value; if (name && placeToSave.label) { const places = getSavedPlaces(); const newPlace = { id: Date.now(), name, label: placeToSave.label, coords: placeToSave.coords }; places.push(newPlace); setSavedPlaces(places); showPage(routePage); } }

    // ===== Core Calculator Logic =====
    function calculateRange() { const actualBatteryLevel = parseInt(batterySlider.value); const selectedMode = document.querySelector('input[name="mode"]:checked').value; const isThrottledMode = capacityToggle.checked; let usableBatteryLevel = isThrottledMode ? Math.max(0, actualBatteryLevel - 10) : actualBatteryLevel; let remainingRange = selectedMode === 'sport' ? usableBatteryLevel * sportKmPerPercent : usableBatteryLevel * ecoKmPerPercent; batteryLevelDisplay.textContent = `${actualBatteryLevel}%`; rangeOutput.textContent = remainingRange.toFixed(1); }
    function updateAndSave() { calculateRange(); saveState(); }

    // ===== Map & Route Logic =====
    function initMap() { if (map) return; map = L.map('map').setView([51.1657, 10.4515], 6); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map); }

    function renderStops() { if (sortable) sortable.destroy(); stopsContainer.innerHTML = ''; waypoints.forEach((waypoint, index) => { const isStart = index === 0; const isEnd = index === waypoints.length - 1; let labelText = isStart ? 'Start' : (isEnd ? 'Ziel' : `Stop ${index}`); const stopDiv = document.createElement('div'); stopDiv.className = 'stop-item bg-gray-700/50 p-2 rounded-md flex items-center space-x-3'; stopDiv.innerHTML = `<svg class="drag-handle h-6 w-6 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><circle cx="7" cy="5" r="1.5" /><circle cx="13" cy="5" r="1.5" /><circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" /><circle cx="7" cy="15" r="1.5" /><circle cx="13" cy="15" r="1.5" /></svg><div class="flex-grow"><label class="text-sm font-medium text-gray-400">${labelText}</label><div class="flex items-center space-x-2 mt-1"><div class="relative flex-grow"><input type="text" data-index="${index}" class="stop-input block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500" autocomplete="off" value="${waypoint.label}"><div class="autocomplete-suggestions absolute w-full mt-1 z-20"></div></div>${!isStart ? `<button data-index="${index}" class="remove-stop-btn p-2 bg-gray-700 rounded-md hover:bg-red-600" title="Stop entfernen">&times;</button>` : `<button class="current-loc-btn p-2 bg-gray-700 rounded-md hover:bg-orange-600" title="Aktuellen Standort verwenden"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg></button>`}</div></div>`; stopsContainer.appendChild(stopDiv); }); attachStopListeners(); initSortable(); }

    function renderFavorites() { if (favoritesSortable) favoritesSortable.destroy(); favoritesListContainer.innerHTML = ''; const places = getSavedPlaces(); places.forEach((place, index) => { const item = document.createElement('div'); item.className = 'favorite-item'; item.dataset.id = place.id; item.innerHTML = `<span class="drag-handle pr-2 cursor-move text-gray-500">:::</span><div class="flex-grow"><p class="font-semibold">${place.name}</p><p class="text-xs text-gray-400">${place.label}</p></div><button data-id="${place.id}" class="delete-favorite-btn p-2 text-red-400 hover:text-red-500">&times;</button>`; favoritesListContainer.appendChild(item); }); document.querySelectorAll('.delete-favorite-btn').forEach(btn => { btn.addEventListener('click', (e) => { const id = e.currentTarget.dataset.id; let places = getSavedPlaces(); places = places.filter(p => p.id != id); setSavedPlaces(places); renderFavorites(); }); }); favoritesSortable = new Sortable(favoritesListContainer, { animation: 150, handle: '.drag-handle', onEnd: (evt) => { let places = getSavedPlaces(); const movedItem = places.splice(evt.oldIndex, 1)[0]; places.splice(evt.newIndex, 0, movedItem); setSavedPlaces(places); } }); }

    function initSortable() { sortable = new Sortable(stopsContainer, { animation: 150, handle: '.drag-handle', delay: 200, delayOnTouchOnly: true, onEnd: (evt) => { const movedItem = waypoints.splice(evt.oldIndex, 1)[0]; waypoints.splice(evt.newIndex, 0, movedItem); renderStops(); } }); }
    function attachStopListeners() { document.querySelectorAll('.stop-input').forEach(input => { input.addEventListener('input', debounce(handleAutocomplete, 150)); input.addEventListener('focus', handleAutocomplete); }); document.querySelectorAll('.remove-stop-btn').forEach(btn => { btn.addEventListener('click', (e) => { waypoints.splice(e.currentTarget.dataset.index, 1); renderStops(); }); }); document.querySelectorAll('.current-loc-btn').forEach(btn => { btn.addEventListener('click', getCurrentLocation); }); }
    function addStop() { waypoints.push({ label: '', coords: null }); renderStops(); }

    async function handleAutocomplete(e) { const input = e.target; const suggestionsContainer = input.nextElementSibling; const text = input.value.trim(); const coordRegex = /^\\\s*(-?\\d{1,3}(?:\\.\\d+)?)\\\\s*.{\\s*(-?\\d{1,3}(?:\\.\\d+)?)\\\\s*$/;
    const coordMatch = text.match(coordRegex);
    if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lon = parseFloat(coordMatch[2]);
        if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            suggestionsContainer.innerHTML = '';
            const coords = [lon, lat];
            const response = await fetch(`https://api.openrouteservice.org/geocode/reverse?api_key=${ORS_API_KEY}&point.lon=${lon}&point.lat=${lat}`);
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                const label = data.features[0].properties.label;
                input.value = label;
                waypoints[input.dataset.index] = { label, coords };
            }
            return;
        }
    }
    const searchText = text.toLowerCase();
    suggestionsContainer.innerHTML = '';
    const savedPlaces = getSavedPlaces();
    const filteredSavedPlaces = savedPlaces.filter(p => p.name.toLowerCase().includes(searchText) || p.label.toLowerCase().includes(searchText));
    let suggestions = filteredSavedPlaces.map(p => ({ ...p, isSaved: true }));
    if (text.length >= 3) {
        const response = await fetch(`https://api.openrouteservice.org/geocode/autocomplete?api_key=${ORS_API_KEY}&text=${text}&layers=venue,address,street`);
        const data = await response.json();
        const apiSuggestions = data.features.map(f => ({ ...f, isSaved: false }));
        suggestions = suggestions.concat(apiSuggestions);
    }
    showSuggestions(suggestions, suggestionsContainer, input); }

    function showSuggestions(features, container, input) {
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        features.forEach(feature => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            const isSaved = feature.isSaved;
            const label = isSaved ? feature.label : feature.properties.label;
            const name = isSaved ? feature.name : null;
            const coords = isSaved ? feature.coords : feature.geometry.coordinates;
            
            item.dataset.label = label;
            item.dataset.coords = JSON.stringify(coords);

            const labelDiv = document.createElement('div');
            labelDiv.className = 'suggestion-item-label';
            if (isSaved) {
                labelDiv.innerHTML = `<div class="name">⭐ ${name}</div><div class="address">${label}</div>`;
            } else {
                labelDiv.textContent = label;
            }
            item.appendChild(labelDiv);

            if (!isSaved) {
                const saveBtn = document.createElement('button');
                saveBtn.className = 'save-place-btn';
                saveBtn.innerHTML = '&#11088;';
                saveBtn.title = "Ort speichern";
                item.appendChild(saveBtn);
            }
            
            const handleSelect = (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (e.target.closest('.save-place-btn')) {
                    openSavePlacePage(item.dataset.label, JSON.parse(item.dataset.coords));
                } else {
                    input.value = item.dataset.label;
                    waypoints[input.dataset.index] = { label: item.dataset.label, coords: JSON.parse(item.dataset.coords) };
                }
                container.innerHTML = '';
            };

            item.addEventListener('mousedown', handleSelect);
            item.addEventListener('touchstart', handleSelect, { passive: false });

            fragment.appendChild(item);
        });

        container.appendChild(fragment);
    }

    async function getCurrentLocation() { if (!navigator.geolocation) { alert("Geolocation wird von deinem Browser nicht unterstützt."); return; }
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://api.openrouteservice.org/geocode/reverse?api_key=${ORS_API_KEY}&point.lon=${longitude}&point.lat=${latitude}`);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            const place = data.features[0];
            waypoints[0] = { label: place.properties.label, coords: place.geometry.coordinates };
            renderStops();
        } else {
            alert("Dein Standort konnte nicht in eine Adresse umgewandelt werden.");
        }
    }, () => alert("Standortzugriff verweigert.")); }

    async function calculateRoute() { const filledWaypoints = waypoints.filter(w => w.coords); if (filledWaypoints.length < 2) { alert("Bitte mindestens Start und Ziel angeben."); return; }
    calculateRouteBtn.disabled = true;
    calculateRouteBtn.textContent = "Berechne...";
    try {
        const coords = filledWaypoints.map(w => w.coords);
        const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car/geojson`, {
            method: 'POST',
            headers: {
                'Authorization': ORS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ coordinates: coords })
        });
        if (!response.ok) throw new Error('Fehler bei der Routenberechnung.');
        const data = await response.json();
        const route = data.features[0];
        const routeCoords = route.geometry.coordinates.map(c => [c[1], c[0]]);
        if (routeLayer) map.removeLayer(routeLayer);
        routeLayer = L.polyline(routeCoords, { color: '#f97316' }).addTo(map);
        map.fitBounds(routeLayer.getBounds());
        let sportBattery = parseInt(batterySlider.value);
        let ecoBattery = parseInt(batterySlider.value);
        let resultsHtml = '';
        route.properties.segments.forEach((segment, i) => {
            const distanceKm = segment.distance / 1000;
            const sportNeeded = distanceKm / sportKmPerPercent;
            const ecoNeeded = distanceKm / ecoKmPerPercent;
            sportBattery -= sportNeeded;
            ecoBattery -= ecoNeeded;
            resultsHtml += `<div class="p-3 bg-gray-700 rounded-lg"><p class="font-bold">Ankunft bei Stop #${i+1}: ${waypoints[i+1].label.substring(0,30)}...</p><p class="text-sm text-gray-400">Distanz für diese Etappe: ${distanceKm.toFixed(1)} km</p><div class="grid grid-cols-2 gap-2 pt-1 text-center"><div><p class="text-xs text-gray-400">Ankunft (Sport)</p><p class="font-bold ${sportBattery < 10 ? 'text-red-500' : ''}">${sportBattery.toFixed(0)}%</p></div><div><p class="text-xs text-gray-400">Ankunft (Eco)</p><p class="font-bold ${ecoBattery < 10 ? 'text-red-500' : ''}">${ecoBattery.toFixed(0)}%</p></div></div></div>`;
        });
        routeResults.innerHTML = `<div class="space-y-3">${resultsHtml}</div>`;
        const isRoundTrip = filledWaypoints.length > 1 && filledWaypoints[0].label === filledWaypoints[filledWaypoints.length - 1].label;
        if (!isRoundTrip) {
            const returnResponse = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car/geojson`, {
                method: 'POST',
                headers: {
                    'Authorization': ORS_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ coordinates: [coords[coords.length - 1], coords[0]] })
            });
            const returnData = await returnResponse.json();
            const returnRoute = returnData.features[0];
            const returnDist = returnRoute.properties.summary.distance / 1000;
            const sportReturnNeeded = returnDist / sportKmPerPercent;
            const ecoReturnNeeded = returnDist / ecoKmPerPercent;
            const finalSportBattery = sportBattery - sportReturnNeeded;
            const finalEcoBattery = ecoBattery - ecoReturnNeeded;
            const returnHtml = `<div class="p-3 mt-3 bg-gray-900 rounded-lg border border-dashed border-gray-600"><p class="font-bold">Direkter Rückweg</p><p class="text-sm text-gray-400">Distanz: ${returnDist.toFixed(1)} km</p><div class="grid grid-cols-2 gap-2 pt-1 text-center"><div><p class="text-xs text-gray-400">Ankunft Zuhause (Sport)</p><p class="font-bold ${finalSportBattery < 10 ? 'text-red-500' : ''}">${finalSportBattery > 0 ? finalSportBattery.toFixed(0) + '%' : 'Nicht möglich'}</p></div><div><p class="text-xs text-gray-400">Ankunft Zuhause (Eco)</p><p class="font-bold ${finalEcoBattery < 10 ? 'text-red-500' : ''}">${finalEcoBattery > 0 ? finalEcoBattery.toFixed(0) + '%' : 'Nicht möglich'}</p></div></div></div>`;
            routeResults.innerHTML += returnHtml;
        }
    } catch (error) {
        console.error(error);
        alert("Ein Fehler ist aufgetreten: " + error.message);
    } finally {
        calculateRouteBtn.disabled = false;
        calculateRouteBtn.textContent = "Route berechnen";
    }}

    // Initial Load & Event Listeners
    loadState();
    calculateRange();
    saveState();

    menuButton.addEventListener('click', () => {
        const isCalculatorOpen = !calculatorPage.classList.contains('hidden');
        if (isCalculatorOpen) {
            showPage(routePage);
            menuIconOpen.classList.add('hidden');
            menuIconClose.classList.remove('hidden');
            initMap();
            renderStops();
        } else {
            showPage(calculatorPage);
            menuIconOpen.classList.remove('hidden');
            menuIconClose.classList.add('hidden');
        }
    });
    manageFavoritesBtn.addEventListener('click', () => { renderFavorites(); showPage(favoritesPage); });
    backToRouteBtn.addEventListener('click', () => showPage(routePage));

    batterySlider.addEventListener('input', updateAndSave);
    capacityToggle.addEventListener('change', updateAndSave);
    modeRadios.forEach(radio => radio.addEventListener('change', updateAndSave));
    plusBtn.addEventListener('click', () => { if (parseInt(batterySlider.value) < 100) { batterySlider.value = parseInt(batterySlider.value) + 1; batterySlider.dispatchEvent(new Event('input')); } });
    minusBtn.addEventListener('click', () => { if (parseInt(batterySlider.value) > 0) { batterySlider.value = parseInt(batterySlider.value) - 1; batterySlider.dispatchEvent(new Event('input')); } });

    addStopBtn.addEventListener('click', addStop);
    calculateRouteBtn.addEventListener('click', calculateRoute);

    confirmSaveBtn.addEventListener('click', confirmSavePlace);
    cancelSaveBtn.addEventListener('click', () => showPage(routePage));
});
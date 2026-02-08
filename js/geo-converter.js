class GeoConverter {
    constructor() {
        this.init();
    }

    init() {
        // Elements
        this.ddInput = document.getElementById('dd-input');
        this.dmsInput = document.getElementById('dms-input');

        this.plusCodeInput = document.getElementById('plus-code');
        this.btnElevation = document.getElementById('btn-get-elevation');
        this.elevationResult = document.getElementById('elevation-result');
        this.elevationValue = document.getElementById('elevation-value');
        this.elevationValueFt = document.getElementById('elevation-value-ft');
        this.elevationValueFt = document.getElementById('elevation-value-ft');
        this.elevationSource = document.getElementById('elevation-source');
        this.checkElevation = document.getElementById('include-elevation');

        // Batch Elements
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.batchElevation = document.getElementById('batch-elevation');
        this.batchElevation = document.getElementById('batch-elevation');
        this.processStatus = document.getElementById('process-status');

        this.mapsLinkResult = document.getElementById('maps-link-result');
        this.mapsLink = document.getElementById('maps-link');

        // Event Listeners
        this.addListeners();
        this.initBatch();
    }

    addListeners() {
        // DD Inputs
        // DD Inputs
        this.ddInput.addEventListener('input', () => this.updateFromDD());

        // DMS Inputs
        this.dmsInput.addEventListener('change', () => this.updateFromDMS());

        // Plus Code
        this.plusCodeInput.addEventListener('change', () => this.updateFromPlusCode());

        // Elevation Toggle
        this.checkElevation.addEventListener('change', (e) => {
            this.btnElevation.style.display = e.target.checked ? 'block' : 'none';
            this.elevationResult.style.display = 'none';
        });

        // Get Elevation Button
        this.btnElevation.addEventListener('click', () => this.fetchElevation());
    }

    // --- Conversion Logic ---

    // 1. From Decimal Degrees
    updateFromDD() {
        const input = this.ddInput.value;
        // Split by comma or space (handling multiple spaces)
        const parts = input.split(/[,\s]+/).filter(Boolean);

        if (parts.length < 2) return;

        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);

        if (isNaN(lat) || isNaN(lon)) return;

        // Update DMS
        const dmsLat = this.ddToDms(lat, true);
        const dmsLon = this.ddToDms(lon, false);

        this.dmsInput.value = `${dmsLat.d}° ${dmsLat.m}' ${dmsLat.s}" ${dmsLat.dir}, ${dmsLon.d}° ${dmsLon.m}' ${dmsLon.s}" ${dmsLon.dir}`;

        // Update Plus Code
        try {
            this.plusCodeInput.value = OpenLocationCode.encode(lat, lon);
        } catch (e) {
            console.error("Plus Code Error", e);
        }
        // Update Plus Code
        try {
            this.plusCodeInput.value = OpenLocationCode.encode(lat, lon);
        } catch (e) {
            console.error("Plus Code Error", e);
        }

        this.updateMapsLink(lat, lon);
    }

    // 2. From DMS
    updateFromDMS() {
        const input = this.dmsInput.value;
        // Match all occurrences of DMS patterns
        // Matches: 28°11'05.1"N or 28 11 05.1 N
        const regex = /(\d+)[°\s]+(\d+)['\s]+([\d.]+)["\s]*([NSEW])/gi;
        const matches = [...input.matchAll(regex)];

        if (matches.length >= 2) {
            // Assume first is Lat, second is Lon
            const latMatch = matches[0];
            const lonMatch = matches[1];

            const lat = this.dmsToDd(latMatch[1], latMatch[2], latMatch[3], latMatch[4].toUpperCase());
            const lon = this.dmsToDd(lonMatch[1], lonMatch[2], lonMatch[3], lonMatch[4].toUpperCase());

            if (lat !== null && lon !== null) {
                this.ddInput.value = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

                // Update Plus Code
                try {
                    this.plusCodeInput.value = OpenLocationCode.encode(lat, lon);
                } catch (e) { }

                this.updateMapsLink(lat, lon);
            }
        }
    }

    // 3. From Plus Code
    async updateFromPlusCode() {
        let input = this.plusCodeInput.value.trim();
        if (!input) return;

        // 1. Extract Code and Locality
        // Regex: Finds the plus code pattern (e.g., "5XMJ+RWF")
        // Valid OLC chars: 23456789CFGHJMPQRVWX
        const codeMatch = input.match(/([23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,})/i);

        if (!codeMatch) {
            alert("Could not identify a Plus Code in the input.");
            return;
        }

        const code = codeMatch[0];
        let locality = input.replace(code, "").trim().replace(/^,/, "").trim(); // Remove code and leading comma

        try {
            // 2. Check if valid
            if (!OpenLocationCode.isValid(code)) {
                throw new Error("Invalid format");
            }

            // 3. Check if full or short
            if (OpenLocationCode.isFull(code)) {
                const decoded = OpenLocationCode.decode(code);
                this.updateCoordinates(decoded.latitudeCenter, decoded.longitudeCenter);
            } else {
                // Short Code - Need Locality
                if (!locality) {
                    alert("This is a short Plus Code. Please add a locality (e.g., '5XMJ+RWF Pokhara').");
                    return;
                }

                this.processStatus.innerText = `Looking up location for '${locality}'...`;
                this.processStatus.style.display = 'block';

                // 4. Geocode Locality (Nominatim)
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locality)}`);
                const data = await response.json();

                if (data && data.length > 0) {
                    const refLat = parseFloat(data[0].lat);
                    const refLon = parseFloat(data[0].lon);

                    // 5. Recover Nearest
                    // Ensure code is upper case for OLC lib
                    const cleanCode = code.toUpperCase();
                    const recovered = OpenLocationCode.recoverNearest(cleanCode, refLat, refLon);
                    const decoded = OpenLocationCode.decode(recovered);

                    this.updateCoordinates(decoded.latitudeCenter, decoded.longitudeCenter);
                    this.processStatus.style.display = 'none';
                } else {
                    alert(`Could not find location for '${locality}'. Please try a Full Plus Code.`);
                    this.processStatus.style.display = 'none';
                }
            }
        } catch (e) {
            console.error(e);
            alert(`Error processing Plus Code: ${e.message}`);
        }
    }

    updateCoordinates(lat, lon) {
        this.ddInput.value = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        this.updateFromDD(); // cascade update to DMS
    }

    updateMapsLink(lat, lon) {
        if (!isNaN(lat) && !isNaN(lon)) {
            this.mapsLink.href = `https://www.google.com/maps?q=${lat},${lon}`;
            this.mapsLinkResult.style.display = 'block';
        } else {
            this.mapsLinkResult.style.display = 'none';
        }
    }

    // Helpers
    ddToDms(deg, isLat) {
        const absolute = Math.abs(deg);
        const d = Math.floor(absolute);
        const minFloat = (absolute - d) * 60;
        const m = Math.floor(minFloat);
        const s = ((minFloat - m) * 60).toFixed(2);
        const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');

        return { d, m, s, dir };
    }

    dmsToDd(d, m, s, dir) {
        if (!d && d !== 0) return null;
        let val = parseFloat(d) + parseFloat(m || 0) / 60 + parseFloat(s || 0) / 3600;
        if (dir === 'S' || dir === 'W') val = val * -1;
        return val;
    }

    // --- Elevation API ---
    async fetchElevation(latArg = null, lonArg = null) {
        let lat = latArg;
        let lon = lonArg;

        if (lat === null || lon === null) {
            const input = this.ddInput.value;
            const parts = input.split(/[,\s]+/).filter(Boolean);
            if (parts.length >= 2) {
                lat = parseFloat(parts[0]);
                lon = parseFloat(parts[1]);
            }
        }

        if (isNaN(lat) || isNaN(lon)) {
            alert("Please enter valid coordinates");
            return;
        }

        if (!latArg) {
            this.elevationResult.style.display = 'block';
            this.elevationValue.innerText = "Loading...";
            this.elevationSource.innerText = "--";
        }

        try {
            // Using Open-Elevation (Public Free API)
            // https://api.open-elevation.com/api/v1/lookup?locations=lat,lon

            // Backup/alternative: https://api.opentopodata.org/v1/aster30m?locations=lat,lon (Rate limited but reliable)
            // Trying Open-Elevation first as it's common for these tools.

            const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            const elev = data.results[0].elevation;

            if (latArg) return elev; // return for batch

            if (elev !== null) {
                this.elevationValue.innerText = elev.toFixed(2);
                this.elevationValueFt.innerText = (elev * 3.28084).toFixed(2);
                this.elevationSource.innerText = "Open-Elevation (Public API)";
            } else {
                this.elevationValue.innerText = "N/A";
                this.elevationValueFt.innerText = "N/A";
                this.elevationSource.innerText = "N/A";
            }
        } catch (e) {
            console.warn("Open-Elevation failed, trying OpenTopoData (ASTER 30m)...");
            try {
                const response = await fetch(`https://api.opentopodata.org/v1/aster30m?locations=${lat},${lon}`);
                const data = await response.json();
                const elev = data.results[0].elevation;

                if (latArg) return elev;

                if (elev !== null) {
                    this.elevationValue.innerText = elev.toFixed(2);
                    this.elevationValueFt.innerText = (elev * 3.28084).toFixed(2);
                    this.elevationSource.innerText = "OpenTopoData (ASTER 30m)";
                } else {
                    this.elevationValue.innerText = "N/A";
                    this.elevationValueFt.innerText = "N/A";
                    this.elevationSource.innerText = "N/A";
                }
            } catch (err) {
                console.error(err);
                if (!latArg) {
                    this.elevationValue.innerText = "Error";
                    this.elevationValueFt.innerText = "Error";
                }
                return null;
            }
        }
    }

    // --- Batch Processing ---
    initBatch() {
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFile(e.target.files[0]));

        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-active');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-active');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-active');
            if (e.dataTransfer.files.length) {
                this.handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    handleFile(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            this.processBatch(jsonData);
        };
        reader.readAsArrayBuffer(file);
    }

    async processBatch(data) {
        this.processStatus.style.display = 'block';
        this.processStatus.innerText = `Processing ${data.length} rows...`;

        const includeElev = this.batchElevation.checked;
        const processed = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            let lat = null, lon = null;

            // --- Strategy 1: Decimal Degrees ---
            const dLat = parseFloat(row['Latitude'] || row['latitude'] || row['Lat'] || row['lat']);
            const dLon = parseFloat(row['Longitude'] || row['longitude'] || row['Lon'] || row['lon']);
            if (!isNaN(dLat) && !isNaN(dLon)) {
                lat = dLat;
                lon = dLon;
            }

            // --- Strategy 2: Plus Code ---
            if (lat === null) {
                const code = row['Plus Code'] || row['plus code'] || row['PlusCode'] || row['Code'];
                if (code) {
                    try {
                        // Handle short codes if Reference Lat/Lon provided
                        // For now, assume full code or error
                        if (OpenLocationCode.isValid(code)) {
                            const decoded = OpenLocationCode.decode(code);
                            lat = decoded.latitudeCenter;
                            lon = decoded.longitudeCenter;
                        } else {
                            // Try cleaning
                            const match = code.match(/([23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,})/i);
                            if (match && OpenLocationCode.isValid(match[0])) {
                                const decoded = OpenLocationCode.decode(match[0]);
                                lat = decoded.latitudeCenter;
                                lon = decoded.longitudeCenter;
                            }
                        }
                    } catch (e) { console.warn("Batch: Invalid Code", code); }
                }
            }

            // --- Strategy 3: DMS Parts (Deg, Min, Sec, Dir) ---
            if (lat === null) {
                // Try simple loose matching for headers
                const getVal = (keys) => {
                    for (let k of keys) if (row[k] !== undefined) return row[k];
                    return null;
                }

                // Latitude
                const latD = getVal(['Lat Deg', 'Lat D', 'LatD']);
                const latM = getVal(['Lat Min', 'Lat M', 'LatM']);
                const latS = getVal(['Lat Sec', 'Lat S', 'LatS']);
                const latDir = getVal(['Lat Dir', 'LatDir']);

                // Longitude
                const lonD = getVal(['Lon Deg', 'Lon D', 'LonD']);
                const lonM = getVal(['Lon Min', 'Lon M', 'LonM']);
                const lonS = getVal(['Lon Sec', 'Lon S', 'LonS']);
                const lonDir = getVal(['Lon Dir', 'LonDir']);

                if (latD !== null && lonD !== null) {
                    lat = this.dmsToDd(latD, latM, latS, latDir);
                    lon = this.dmsToDd(lonD, lonM, lonS, lonDir);
                }
            }

            // --- Strategy 4: DMS Strings (e.g. "28°11'05.1\"N") ---
            if (lat === null) {
                const latStr = row['Latitude DMS'] || row['Lat DMS'] || row['DMS Lat'];
                const lonStr = row['Longitude DMS'] || row['Lon DMS'] || row['DMS Lon'];

                if (latStr && lonStr) {
                    const parseDms = (str) => {
                        // Matches: 28°11'05.1"N or 28 11 05.1 N
                        const match = str.match(/(\d+)[°\s]+(\d+)['\s]+([\d.]+)["\s]*([NSEW])/i);
                        if (match) {
                            return this.dmsToDd(match[1], match[2], match[3], match[4].toUpperCase());
                        }
                        return null;
                    };

                    lat = parseDms(latStr);
                    lon = parseDms(lonStr);
                }
            }

            // --- Output Generation ---
            if (lat !== null && lon !== null) {
                if (isNaN(lat) || isNaN(lon)) {
                    row['Error'] = "Invalid Coordinates";
                } else {
                    // Ensure pure Decimal Output
                    row['Latitude (DD)'] = lat.toFixed(6);
                    row['Longitude (DD)'] = lon.toFixed(6);

                    // Conversions
                    const dmsLat = this.ddToDms(lat, true);
                    const dmsLon = this.ddToDms(lon, false);

                    row['DMS Latitude'] = `${dmsLat.d}° ${dmsLat.m}' ${dmsLat.s}" ${dmsLat.dir}`;
                    row['DMS Longitude'] = `${dmsLon.d}° ${dmsLon.m}' ${dmsLon.s}" ${dmsLon.dir}`;

                    try {
                        row['Plus Code (Generated)'] = OpenLocationCode.encode(lat, lon);
                    } catch (e) { row['Plus Code (Generated)'] = 'Error'; }

                    if (includeElev) {
                        this.processStatus.innerText = `Processing row ${i + 1} of ${data.length} (fetching elevation)...`;
                        // Delay to be nice to API
                        await new Promise(r => setTimeout(r, 1500));
                        const elev = await this.fetchElevation(lat, lon);
                        row['Elevation (m)'] = elev;
                        row['Elevation (ft)'] = elev ? (elev * 3.28084).toFixed(2) : null;
                    }
                }
            } else {
                row['Error'] = "Could not resolve coordinates";
            }

            processed.push(row);
        }

        this.processStatus.innerText = "Done! Downloading...";
        this.downloadExcel(processed);
    }

    downloadExcel(data) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Converted");

        XLSX.writeFile(workbook, "GeoLocation_Converted.xlsx");
        this.processStatus.style.display = 'none';
    }
}

// Init
const geoApp = new GeoConverter();

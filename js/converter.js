class AreaConverter {
    constructor() {
        this.converters = [];
        this.container = document.getElementById('converters-container');
        this.summaryContainer = document.getElementById('summary-values');
        this.addBtn = document.getElementById('add-converter-btn');

        // Conversion Factors (Base: Sq. Feet)
        this.factors = {
            // Standard
            sq_feet: 1,
            sq_meter: 10.76391042,
            acre: 43560,
            hectare: 107639.1042,
            // Mountain
            ropani: 5476,
            aana: 342.25,
            paisa: 85.5625,
            daam: 21.390625,
            // Terai
            bigha: 72900,
            kattha: 3645,
            dhur: 182.25
        };

        this.init();
    }

    init() {
        this.addBtn.addEventListener('click', () => this.addConverterTable());
        this.addConverterTable(); // Add initial table
    }

    addConverterTable() {
        const id = Date.now();
        const html = `
            <div class="converter-card" id="card-${id}">
                <div class="card-header">
                    <h3><i class="fas fa-exchange-alt"></i> Area Conversion Table</h3>
                    ${this.converters.length > 0 ? `<button class="btn-remove" onclick="app.removeConverter(${id})"><i class="fas fa-times"></i></button>` : ''}
                </div>
                
                <div class="unit-systems-grid">
                    <!-- Standard Units -->
                    <div class="unit-column">
                        <div class="system-title">Standard Units</div>
                        ${this.renderInput(id, 'sq_feet', 'Sq. Feet')}
                        ${this.renderInput(id, 'sq_meter', 'Sq. Meter')}
                        ${this.renderInput(id, 'acre', 'Acre')}
                        ${this.renderInput(id, 'hectare', 'Hectare')}
                    </div>

                    <!-- Mountain System -->
                    <div class="unit-column">
                        <div class="system-title">Mountain System (R-A-P-D)</div>
                        ${this.renderInput(id, 'ropani', 'Ropani')}
                        ${this.renderInput(id, 'aana', 'Aana')}
                        ${this.renderInput(id, 'paisa', 'Paisa')}
                        ${this.renderInput(id, 'daam', 'Daam')}
                        
                        <div class="composite-group">
                            <label>R-A-P-D</label>
                            <input type="text" class="composite-input" data-sys="mountain" placeholder="0-0-0-0" oninput="app.handleComposite(this, ${id})">
                        </div>
                    </div>

                    <!-- Terai System -->
                    <div class="unit-column">
                        <div class="system-title">Terai System (B-K-D)</div>
                        ${this.renderInput(id, 'bigha', 'Bigha')}
                        ${this.renderInput(id, 'kattha', 'Kattha')}
                        ${this.renderInput(id, 'dhur', 'Dhur')}
                        
                        <div class="composite-group">
                            <label>Composite (B-K-D)</label>
                            <input type="text" class="composite-input" data-sys="terai" placeholder="0-0-0" oninput="app.handleComposite(this, ${id})">
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', html);
        this.converters.push({ id: id, baseValue: 0 }); // baseValue in Sq. Feet
    }

    renderInput(id, unitKey, label) {
        return `
            <div class="input-group">
                <label>${label}</label>
                <input type="number" step="any" min="0" data-unit="${unitKey}" oninput="app.updateValues(this, ${id})">
            </div>
        `;
    }

    removeConverter(id) {
        const card = document.getElementById(`card-${id}`);
        if (card) {
            card.remove();
            this.converters = this.converters.filter(c => c.id !== id);
            this.calculateTotalSummary();
        }
    }

    updateValues(input, id) {
        const unit = input.dataset.unit;
        const value = parseFloat(input.value) || 0;

        // 1. Calculate Base Value (Sq. Feet)
        const baseValue = value * this.factors[unit];

        // 2. Update State
        const converter = this.converters.find(c => c.id === id);
        if (converter) converter.baseValue = baseValue;

        // 3. Update DOM for this card
        this.updateCardInputs(id, baseValue, input); // pass input to avoid refocusing/overwriting active field

        // 4. Update Summary
        this.calculateTotalSummary();
    }

    updateCardInputs(id, baseValue, sourceInput) {
        const card = document.getElementById(`card-${id}`);
        const inputs = card.querySelectorAll('input[type="number"]');

        inputs.forEach(inp => {
            if (inp === sourceInput) return; // Skip the active input

            const unit = inp.dataset.unit;
            const val = baseValue / this.factors[unit];

            // Format to avoid floating point ugliness, but keep precision
            inp.value = Math.abs(val) < 0.000001 ? '' : parseFloat(val.toFixed(6));
        });

        // Update Composite Fields
        this.updateCompositeDisplay(card, baseValue);
    }

    handleComposite(input, id) {
        const val = input.value.trim();
        const parts = val.split(/[-\s,.]+/).map(Number);
        const sys = input.dataset.sys;
        let baseValue = 0;

        if (sys === 'mountain') {
            // R-A-P-D : 16 Aana = 1 Ropani, 4 Paisa = 1 Aana, 4 Daam = 1 Paisa
            const r = parts[0] || 0;
            const a = parts[1] || 0;
            const p = parts[2] || 0;
            const d = parts[3] || 0;
            baseValue = (r * this.factors.ropani) + (a * this.factors.aana) + (p * this.factors.paisa) + (d * this.factors.daam);
        } else {
            // B-K-D : 20 Kattha = 1 Bigha, 20 Dhur = 1 Kattha
            const b = parts[0] || 0;
            const k = parts[1] || 0;
            const d = parts[2] || 0;
            baseValue = (b * this.factors.bigha) + (k * this.factors.kattha) + (d * this.factors.dhur);
        }

        // Update State
        const converter = this.converters.find(c => c.id === id);
        if (converter) converter.baseValue = baseValue;

        // Update DOM
        this.updateCardInputs(id, baseValue, null); // passing null updates ALL number inputs
        this.calculateTotalSummary();
    }

    updateCompositeDisplay(card, baseValue) {
        // Mountain R-A-P-D
        const r_float = baseValue / this.factors.ropani;
        const r = Math.floor(r_float);
        const rem_r = baseValue - (r * this.factors.ropani);

        const a_float = rem_r / this.factors.aana;
        const a = Math.floor(a_float);
        const rem_a = rem_r - (a * this.factors.aana);

        const p_float = rem_a / this.factors.paisa;
        const p = Math.floor(p_float);
        const rem_p = rem_a - (p * this.factors.paisa);

        const d_float = rem_p / this.factors.daam;
        const d = parseFloat(d_float.toFixed(3)); // allow decimals in daam? usually it's last unit.

        card.querySelector('input[data-sys="mountain"]').value = `${r}-${a}-${p}-${d}`;

        // Terai B-K-D
        const b_float = baseValue / this.factors.bigha;
        const b = Math.floor(b_float);
        const rem_b = baseValue - (b * this.factors.bigha);

        const k_float = rem_b / this.factors.kattha;
        const k = Math.floor(k_float);
        const rem_k = rem_b - (k * this.factors.kattha);

        const dhur_float = rem_k / this.factors.dhur;
        const dhur = parseFloat(dhur_float.toFixed(3));

        card.querySelector('input[data-sys="terai"]').value = `${b}-${k}-${dhur}`;
    }

    calculateTotalSummary() {
        const totalBase = this.converters.reduce((sum, c) => sum + c.baseValue, 0);

        const displayUnits = [
            { key: 'sq_feet', label: 'Sq. Feet' },
            { key: 'sq_meter', label: 'Sq. Meter' },
            { key: 'acre', label: 'Acre' },
            { key: 'hectare', label: 'Hectare' },
            { key: 'ropani', label: 'Ropani' },
            { key: 'aana', label: 'Aana' },
            { key: 'paisa', label: 'Paisa' },
            { key: 'daam', label: 'Daam' },
            { key: 'bigha', label: 'Bigha' },
            { key: 'kattha', label: 'Kattha' },
            { key: 'dhur', label: 'Dhur' },
        ];

        let html = '';
        displayUnits.forEach(u => {
            const val = totalBase / this.factors[u.key];
            html += `
                <div class="summary-row">
                    <span>${u.label}</span>
                    <span>${val.toFixed(3)}</span>
                </div>
            `;
        });

        // Add Composite Totals
        this.summaryContainer.innerHTML = html;
        this.updateSummaryComposite(totalBase);
    }

    updateSummaryComposite(baseValue) {
        // Just reusing logic here for sidebar composite display (simplified manual)
        // Ideally refactor format logic into utility function.

        // R-A-P-D
        const r = Math.floor(baseValue / this.factors.ropani);
        const rem_r = baseValue % this.factors.ropani;
        const a = Math.floor(rem_r / this.factors.aana);
        const rem_a = rem_r % this.factors.aana;
        const p = Math.floor(rem_a / this.factors.paisa);
        const rem_p = rem_a % this.factors.paisa;
        const d = (rem_p / this.factors.daam).toFixed(3);

        document.getElementById('summary-rapd').innerText = `${r}-${a}-${p}-${d}`;

        // B-K-D
        const b = Math.floor(baseValue / this.factors.bigha);
        const rem_b = baseValue % this.factors.bigha;
        const k = Math.floor(rem_b / this.factors.kattha);
        const rem_k = rem_b % this.factors.kattha;
        const dhur = (rem_k / this.factors.dhur).toFixed(3);

        document.getElementById('summary-bkd').innerText = `${b}-${k}-${dhur}`;
    }
}

// Initialize App
const app = new AreaConverter();

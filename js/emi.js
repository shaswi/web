class EmiCalculator {
    constructor() {
        // Elements
        this.elm = {
            amount: document.getElementById('amount'),
            rate: document.getElementById('rate'),
            tenure: document.getElementById('tenure'),
            calculateBtn: document.getElementById('calculate-btn'),
            exportBtn: document.getElementById('export-btn'),
            tenureType: document.getElementsByName('tenure-type'),

            // Summary
            emiDisplay: document.getElementById('display-emi'),
            interestDisplay: document.getElementById('display-interest'),
            totalDisplay: document.getElementById('display-total'),

            // Table
            reportBody: document.getElementById('report-body')
        };

        this.chartInstance = null;
        this.reportData = [];

        this.init();
    }

    init() {
        this.elm.calculateBtn.addEventListener('click', () => this.calculate());
        this.elm.exportBtn.addEventListener('click', () => this.exportToExcel());

        // Real-time Calculation Listeners
        ['input', 'change'].forEach(evt => {
            this.elm.amount.addEventListener(evt, () => this.calculate());
            this.elm.rate.addEventListener(evt, () => this.calculate());
            this.elm.tenure.addEventListener(evt, () => this.calculate());
        });

        this.elm.tenureType.forEach(radio => {
            radio.addEventListener('change', () => {
                this.calculate();
            });
        });

        // Initial Calculation
        this.calculate();
    }

    getTenureMonths() {
        let type = 'year';
        for (let r of this.elm.tenureType) {
            if (r.checked) type = r.value;
        }

        const val = parseFloat(this.elm.tenure.value) || 0;
        return type === 'year' ? val * 12 : val;
    }

    calculate() {
        const P = parseFloat(this.elm.amount.value) || 0;
        const R_annual = parseFloat(this.elm.rate.value) || 0;
        const n = this.getTenureMonths();

        if (P <= 0 || R_annual <= 0 || n <= 0) {
            alert("Please enter valid positive numbers.");
            return;
        }

        const r = R_annual / 12 / 100; // Monthly Rate

        // EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)
        const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = emi * n;
        const totalInterest = totalPayment - P;

        // Update Summary
        this.updateDisplay(emi, totalInterest, totalPayment);

        // Update Chart
        this.renderChart(P, totalInterest);

        // Generate Report
        this.generateReport(P, emi, r, n);
    }

    updateDisplay(emi, interest, total) {
        this.elm.emiDisplay.innerText = this.formatCurrency(emi);
        this.elm.interestDisplay.innerText = this.formatCurrency(interest);
        this.elm.totalDisplay.innerText = this.formatCurrency(total);
    }

    formatCurrency(num) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'NPR', // Using NPR since implied location is Nepal, or general
            maximumFractionDigits: 0
        }).format(num);
    }

    renderChart(principal, interest) {
        const ctx = document.getElementById('emiChart').getContext('2d');

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Principal Amount', 'Total Interest'],
                datasets: [{
                    data: [principal, interest],
                    backgroundColor: ['#2563EB', '#06B6D4'], // Brand Colors
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94A3B8',
                            font: { family: 'Plus Jakarta Sans' }
                        }
                    }
                }
            }
        });
    }

    generateReport(P, emi, r, n) {
        let balance = P;
        let html = '';
        this.reportData = []; // Clear for export

        for (let m = 1; m <= n; m++) {
            const interest = balance * r;
            const principal = emi - interest;
            const opening = balance;
            balance = balance - principal;

            if (balance < 0) balance = 0; // Floating point fix

            const row = {
                Month: m,
                Opening: opening,
                Principal: principal,
                Interest: interest,
                EMI: emi,
                Closing: balance
            };

            this.reportData.push(row);

            html += `
                <tr>
                    <td>${m}</td>
                    <td>${this.formatNumber(opening)}</td>
                    <td>${this.formatNumber(emi)}</td>
                    <td>${this.formatNumber(principal)}</td>
                    <td>${this.formatNumber(interest)}</td>
                    <td>${this.formatNumber(balance)}</td>
                </tr>
            `;
        }

        this.elm.reportBody.innerHTML = html;
        document.getElementById('report-count').innerText = `${n} Months`;
    }

    formatNumber(num) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    exportToExcel() {
        if (!this.reportData.length) return;

        // Prepare data for SheetJS
        const ws = XLSX.utils.json_to_sheet(this.reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "EMI Report");

        // Download
        XLSX.writeFile(wb, "ShaSWi_EMI_Report.xlsx");
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    window.emiApp = new EmiCalculator();
});

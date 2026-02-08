class AmountConverter {
    constructor() {
        this.init();
    }

    init() {
        this.amountInput = document.getElementById('amount-input');
        this.countrySelect = document.getElementById('country-select');
        this.caseSelect = document.getElementById('case-select');
        this.onlySuffix = document.getElementById('only-suffix');
        this.resultBox = document.getElementById('result-box');
        this.resultText = document.getElementById('result-text');
        this.currencySymbol = document.getElementById('currency-symbol');
        this.formatBadge = document.getElementById('format-badge');
        this.copyBtn = document.getElementById('copy-btn');

        this.addListeners();
        // Initial update to set default symbols
        this.updateCountryDefaults();
    }

    addListeners() {
        this.amountInput.addEventListener('input', () => this.convert());
        this.countrySelect.addEventListener('change', () => {
            this.updateCountryDefaults();
            this.convert();
        });
        this.caseSelect.addEventListener('change', () => this.convert());
        this.onlySuffix.addEventListener('change', () => this.convert());

        this.copyBtn.addEventListener('click', () => {
            const text = this.resultText.innerText;
            if (text) {
                navigator.clipboard.writeText(text);
                const originalIcon = this.copyBtn.innerHTML;
                this.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    this.copyBtn.innerHTML = originalIcon;
                }, 2000);
            }
        });
    }

    updateCountryDefaults() {
        const country = this.countrySelect.value;
        let symbol = '';
        let badgeText = '';
        let badgeClass = '';

        switch (country) {
            case 'nepal':
                symbol = 'NPR';
                badgeText = 'Nepali Format (Lakh/Crore)';
                badgeClass = 'format-nepal';
                break;
            case 'india':
                symbol = 'INR';
                badgeText = 'Indian Format (Lakh/Crore)';
                badgeClass = 'format-nepal';
                break;
            case 'usa':
                symbol = 'USD';
                badgeText = 'International Format (Million/Billion)';
                badgeClass = 'format-intl';
                break;
            case 'australia':
                symbol = 'AUD';
                badgeText = 'International Format (Million/Billion)';
                badgeClass = 'format-intl';
                break;
            case 'canada':
                symbol = 'CAD';
                badgeText = 'International Format (Million/Billion)';
                badgeClass = 'format-intl';
                break;
            case 'euro':
                symbol = 'EUR';
                badgeText = 'European Format (Million/Billion)';
                badgeClass = 'format-intl';
                break;
            case 'uk':
                symbol = 'GBP';
                badgeText = 'UK Format (Million/Billion)';
                badgeClass = 'format-intl';
                break;
        }

        this.currencySymbol.innerText = symbol;
        this.formatBadge.innerText = badgeText;
        this.formatBadge.className = `format-badge ${badgeClass}`;
    }

    convert() {
        const amount = parseFloat(this.amountInput.value);
        if (isNaN(amount) || amount < 0) {
            this.resultBox.style.display = 'none';
            return;
        }

        const country = this.countrySelect.value;
        const useLakhCrore = ['nepal', 'india'].includes(country);

        let currencyName = '';
        let minorName = '';

        switch (country) {
            case 'nepal': currencyName = 'Rupees'; minorName = 'Paisa'; break;
            case 'india': currencyName = 'Rupees'; minorName = 'Paisa'; break;
            case 'usa': currencyName = 'Dollars'; minorName = 'Cents'; break;
            case 'australia': currencyName = 'Dollars'; minorName = 'Cents'; break;
            case 'canada': currencyName = 'Dollars'; minorName = 'Cents'; break;
            case 'euro': currencyName = 'Euros'; minorName = 'Cents'; break;
            case 'uk': currencyName = 'Pounds'; minorName = 'Pence'; break;
        }

        const parts = amount.toString().split('.');
        let integerPart = parseInt(parts[0]);
        let fractionalPart = parts[1] ? parseInt(parts[1].substring(0, 2).padEnd(2, '0')) : 0;

        // Handling very small numbers where JS formatting might use exponential notation or precision issues
        // For simplicity, relying on standard float parsing but careful with splits.

        let words = '';

        if (integerPart === 0) {
            words = 'Zero';
        } else {
            words = useLakhCrore ? this.toWordsLakhCrore(integerPart) : this.toWordsInternational(integerPart);
        }

        words += ` ${currencyName}`;

        if (fractionalPart > 0) {
            words += ' and ';
            words += useLakhCrore ? this.toWordsLakhCrore(fractionalPart) : this.toWordsInternational(fractionalPart);
            words += ` ${minorName}`;
        }

        if (this.onlySuffix.checked) {
            words += ' Only';
        }

        // Apply Case
        const caseMode = this.caseSelect.value;
        if (caseMode === 'upper') words = words.toUpperCase();
        else if (caseMode === 'lower') words = words.toLowerCase();
        else if (caseMode === 'title') words = this.toTitleCase(words);
        else if (caseMode === 'sentence') words = words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();

        this.resultText.innerText = words;
        this.resultBox.style.display = 'block';
    }

    toTitleCase(str) {
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

    // Number to Words Logic

    // Arrays for conversion
    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    convertLessThanOneThousand(n) {
        if (n === 0) return '';

        let str = '';

        if (n >= 100) {
            str += this.ones[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }

        if (n >= 20) {
            str += this.tens[Math.floor(n / 10)] + ' ';
            n %= 10;
        }

        if (n > 0) {
            str += this.ones[n] + ' ';
        }

        return str.trim();
    }

    toWordsInternational(n) {
        if (n === 0) return 'Zero';

        const units = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];
        let words = '';
        let i = 0;

        while (n > 0) {
            if (n % 1000 !== 0) {
                words = this.convertLessThanOneThousand(n % 1000) + ' ' + units[i] + ' ' + words;
            }
            n = Math.floor(n / 1000);
            i++;
        }

        return words.trim();
    }

    toWordsLakhCrore(n) {
        if (n === 0) return 'Zero';

        let words = '';

        // Crores (1,00,00,000)
        let crores = Math.floor(n / 10000000);
        n %= 10000000;
        if (crores > 0) {
            // Crores can be larger than 100 if number is huge, technically for Nepali/Indian system
            // typically we resort to "X Crore Y Lakh..." recursion or just handle large crores.
            // A common way for huge numbers in this system is saying "100 Crore".
            // Let's simply handle up to reasonable limits, or recurse if crore > 99 (e.g. 100 crore)
            words += this.toWordsLakhCrore(crores) + ' Crore ';
        }

        // Lakhs (1,00,000)
        let lakhs = Math.floor(n / 100000);
        n %= 100000;
        if (lakhs > 0) {
            words += this.convertLessThanOneThousand(lakhs) + ' Lakh ';
        }

        // Thousands (1,000)
        let thousands = Math.floor(n / 1000);
        n %= 1000;
        if (thousands > 0) {
            words += this.convertLessThanOneThousand(thousands) + ' Thousand ';
        }

        // Remaining (Hundreds)
        if (n > 0) {
            words += this.convertLessThanOneThousand(n);
        }

        return words.trim();
    }
}

// Init
const amountApp = new AmountConverter();

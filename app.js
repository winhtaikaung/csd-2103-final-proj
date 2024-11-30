

class CryptoTracker {
    constructor() {
        this.cryptoData = [];
        this.selectedCryptos = new Set();
        this.autoRefresh = true;
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.loadPreferences();
        this.setupEventListeners();
        this.fetchData();
        this.startAutoRefresh();
    }

    loadPreferences() {
        const stored = localStorage.getItem('cryptoPreferences');
        if (stored) {
            const prefs = JSON.parse(stored);
            this.selectedCryptos = new Set(prefs.selected);
            this.autoRefresh = prefs.autoRefresh;
        }
    }

    savePreferences() {
        const prefs = {
            selected: Array.from(this.selectedCryptos),
            autoRefresh: this.autoRefresh
        };
        localStorage.setItem('cryptoPreferences', JSON.stringify(prefs));
    }

    setupEventListeners() {
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.sortCryptos(e.target.value);
        });

        document.getElementById('toggleRefresh').addEventListener('click', () => {
            this.toggleAutoRefresh();
        });
    }

    async fetchData() {
        // In real implementation, this would fetch from CoinGecko API
        const myHeaders = new Headers();
        myHeaders.append("accept", "application/json");
        myHeaders.append("x-cg-demo-api-key", atob("Q0ctZUpnQjFxZmlXRThSUDV0aVQ1NDNoRmhG"));

        var requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };

        const localCache = localStorage.getItem("api-cache")
        const cacheObj = JSON.parse(localCache)

        if (localCache === null || (localCache !== null && Date.now() - cacheObj.ts > 30000)) {
            const result = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=cad&ids=bitcoin%2Cethereum%2Csolana%2Cpolkadot%2Cdoge%2Ccardano%2Cstellar", requestOptions)
            this.cryptoData = await result.json()
            localStorage.setItem("api-cache", JSON.stringify({ "resp": this.cryptoData, "ts": Date.now() }))
            console.log(`Cache Updated at ${Date.now()}`)
        } else {
            this.cryptoData = cacheObj.resp
        }

        this.renderCryptos();
    }

    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.autoRefresh) {
            this.refreshInterval = setInterval(() => this.fetchData(), 60000);
        }
    }

    toggleAutoRefresh() {
        this.autoRefresh = !this.autoRefresh;
        document.getElementById('toggleRefresh').textContent =
            `Auto Refresh: ${this.autoRefresh ? 'ON' : 'OFF'}`;
        this.savePreferences();
        this.startAutoRefresh();
    }

    sortCryptos(by) {
        switch (by) {
            case 'name':
                this.cryptoData.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'price':
                this.cryptoData.sort((a, b) => b.current_price - a.current_price);
                break;
            case 'change':
                this.cryptoData.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
                break;
        }
        this.renderCryptos();
    }

    toggleSelection(cryptoId) {
        if (this.selectedCryptos.has(cryptoId)) {
            this.selectedCryptos.delete(cryptoId);
        } else if (this.selectedCryptos.size < 5) {
            this.selectedCryptos.add(cryptoId);
        }
        this.savePreferences();
        this.renderCryptos();
        this.renderComparison();
    }

    renderCryptos() {
        const grid = document.getElementById('cryptoGrid');
        grid.innerHTML = this.cryptoData.map(crypto => `
                    <div class="crypto-card ${this.selectedCryptos.has(crypto.id) ? 'selected' : ''}"
                         onclick="cryptoTracker.toggleSelection('${crypto.id}')">
                        <div class="crypto-name">${crypto.name}</div>
                        <div class="crypto-symbol">${crypto.symbol.toUpperCase()}</div>
                        <div class="crypto-price">$${crypto.current_price.toLocaleString()}</div>
                        <div class="price-change ${crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                            ${crypto.price_change_percentage_24h > 0 ? '+' : ''}${crypto.price_change_percentage_24h.toFixed(2)}%
                        </div>
                    </div>
                `).join('');
        this.renderComparison();
    }

    renderComparison() {
        const grid = document.getElementById('comparisonGrid');
        grid.innerHTML = Array.from(this.selectedCryptos)
            .map(id => this.cryptoData.find(c => c.id === id))
            .map(crypto => crypto ? `
                        <div class="crypto-card">
                            <div class="crypto-name">${crypto.name}</div>
                            <div class="crypto-price">$${crypto.current_price.toLocaleString()}</div>
                            <div class="price-change ${crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                                ${crypto.price_change_percentage_24h > 0 ? '+' : ''}${crypto.price_change_percentage_24h.toFixed(2)}%
                            </div>
                        </div>
                    ` : '').join('');
    }
}

const cryptoTracker = new CryptoTracker();

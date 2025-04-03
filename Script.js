document.getElementById('form').addEventListener('submit', function(event) {
    event.preventDefault();
    const symbol = document.getElementById('symbol').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    fetchMarketData(symbol, startDate, endDate).then(data => {
        const rsiData = calculateRSI(data);
        const results = runBacktest(rsiData);
        displayResults(results);
    }).catch(error => {
        console.error("Error fetching market data: ", error);
        document.getElementById('results').innerHTML = '<p style="color: red;">Failed to fetch market data. Please try again later.</p>';
    });
});

async function fetchMarketData(symbol, startDate, endDate) {
    const apiKey = 'd72d6343c53b5d238621bf290800c277';
    const url = `https://api.marketstack.com/v1/eod?access_key=${d72d6343c53b5d238621bf290800c277}&symbols=${symbol}&date_from=${startDate}&date_to=${endDate}`;
    const response = await fetch(url);
    const json = await response.json();
    return json.data;
}

function calculateRSI(data, period = 14) {
    let gains = [];
    let losses = [];
    let rsi = [];

    for (let i = 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    let rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));

    for (let i = period; i < gains.length; i++) {
        const gain = gains[i];
        const loss = losses[i];

        const newAvgGain = ((avgGain * (period - 1)) + gain) / period;
        const newAvgLoss = ((avgLoss * (period - 1)) + loss) / period;

        rs = newAvgGain / newAvgLoss;
        rsi.push(100 - (100 / (1 + rs)));
    }

    return rsi;
}

function runBacktest(rsiData) {
    let cash = 10000;
    let shares = 0;
    const results = [];

    for (let i = 0; i < rsiData.length; i++) {
        if (rsiData[i] < 30 && cash > 0) {
            shares = cash / rsiData[i];
            cash = 0;
            results.push({ action: 'Buy', price: rsiData[i], shares });
        } else if (rsiData[i] > 70 && shares > 0) {
            cash = shares * rsiData[i];
            shares = 0;
            results.push({ action: 'Sell', price: rsiData[i], cash });
        }
    }

    results.push({ finalCash: cash });
    return results;
}

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<h2>Backtest Results</h2>';
    results.forEach(result => {
        if (result.action) {
            resultsDiv.innerHTML += `<p>${result.action} at $${result.price.toFixed(2)}, Shares: ${result.shares.toFixed(2)}</p>`;
        } else {
            resultsDiv.innerHTML += `<p>Final Cash: $${result.finalCash.toFixed(2)}</p>`;
        }
    });
}

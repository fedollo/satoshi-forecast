// Funzione per ottenere il prezzo del Bitcoin
async function getBitcoinPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const data = await response.json();
        return data.bitcoin.usd;
    } catch (error) {
        console.error('Errore nel recupero del prezzo:', error);
        return null;
    }
}

// Funzione per generare una predizione casuale
function generatePrediction() {
    return Math.random() < 0.5 ? 'LONG' : 'SHORT';
}

// Funzione per salvare una predizione nel localStorage
function savePrediction(prediction, price) {
    const today = new Date().toISOString().split('T')[0];
    const predictions = JSON.parse(localStorage.getItem('predictions') || '[]');

    // Verifica se esiste già una predizione per oggi
    if (predictions.length > 0 && predictions[predictions.length - 1].date === today) {
        return;
    }

    predictions.push({
        date: today,
        prediction: prediction,
        price: price
    });

    localStorage.setItem('predictions', JSON.stringify(predictions));
}

// Funzione per calcolare il risultato di ieri
async function calculateYesterdayResult() {
    const predictions = JSON.parse(localStorage.getItem('predictions') || '[]');
    if (predictions.length < 2) return null;

    const yesterday = predictions[predictions.length - 2];
    const todayPrice = await getBitcoinPrice();

    if (!todayPrice || !yesterday.price) return null;

    const priceDiff = todayPrice - yesterday.price;
    const percentageDiff = (priceDiff / yesterday.price) * 100;

    return {
        prediction: yesterday.prediction,
        result: priceDiff > 0 ? 'LONG' : 'SHORT',
        profit: yesterday.prediction === 'LONG' ? priceDiff > 0 : priceDiff < 0,
        percentage: percentageDiff.toFixed(2)
    };
}

// Funzione per aggiornare la tabella dello storico
function updateHistoryTable() {
    const predictions = JSON.parse(localStorage.getItem('predictions') || '[]');
    const tbody = document.getElementById('historyTable');
    tbody.innerHTML = '';

    predictions.slice().reverse().forEach(pred => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(pred.date).toLocaleDateString('it-IT')}</td>
            <td class="${pred.prediction.toLowerCase()}">${pred.prediction}</td>
            <td>$${pred.price.toLocaleString()}</td>
            <td>${pred.result ? `<span class="${pred.profit ? 'profit' : 'loss'}">${pred.profit ? '+' : '-'}${pred.percentage}%</span>` : 'In attesa'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Funzione principale per inizializzare l'applicazione
async function initializeApp() {
    const currentPrice = await getBitcoinPrice();
    if (!currentPrice) {
        document.getElementById('predictionText').textContent = 'Errore nel recupero del prezzo';
        return;
    }

    // Genera e mostra la predizione di oggi
    const todayPrediction = generatePrediction();
    const predictionElement = document.getElementById('predictionText');
    predictionElement.textContent = todayPrediction;
    predictionElement.className = `h3 ${todayPrediction.toLowerCase()}`;

    // Salva la predizione
    savePrediction(todayPrediction, currentPrice);

    // Calcola e mostra il risultato di ieri
    const yesterdayResult = await calculateYesterdayResult();
    const resultElement = document.getElementById('resultText');

    if (yesterdayResult) {
        resultElement.textContent = `${yesterdayResult.prediction} → ${yesterdayResult.result} (${yesterdayResult.percentage}%)`;
        resultElement.className = `h3 ${yesterdayResult.profit ? 'profit' : 'loss'}`;
    } else {
        resultElement.textContent = 'Nessun risultato disponibile';
    }

    // Aggiorna la tabella dello storico
    updateHistoryTable();
}

// Inizializza l'applicazione quando la pagina viene caricata
document.addEventListener('DOMContentLoaded', initializeApp);

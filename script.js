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
        return predictions[predictions.length - 1];
    }

    const newPrediction = {
        date: today,
        prediction: prediction,
        price: price,
        timestamp: new Date().getTime()
    };

    predictions.push(newPrediction);
    localStorage.setItem('predictions', JSON.stringify(predictions));
    return newPrediction;
}

// Funzione per calcolare il tempo rimanente fino al prossimo aggiornamento
function getTimeUntilNextUpdate() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
        hours,
        minutes,
        seconds
    };
}

// Funzione per aggiornare il timer
function updateTimer() {
    const timeUntilUpdate = getTimeUntilNextUpdate();
    const timerElement = document.getElementById('nextUpdate');
    if (timerElement) {
        timerElement.textContent = `Prossimo aggiornamento tra: ${timeUntilUpdate.hours}h ${timeUntilUpdate.minutes}m ${timeUntilUpdate.seconds}s`;
    }
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
    const savedPrediction = savePrediction(todayPrediction, currentPrice);

    // Aggiungi il timestamp della predizione
    const timestampElement = document.createElement('p');
    timestampElement.className = 'text-muted small';
    timestampElement.textContent = `Generata il ${new Date(savedPrediction.timestamp).toLocaleString('it-IT')}`;
    predictionElement.parentNode.appendChild(timestampElement);

    // Calcola e mostra il risultato di ieri
    const yesterdayResult = await calculateYesterdayResult();
    const resultElement = document.getElementById('yesterdayResult');

    if (yesterdayResult) {
        resultElement.innerHTML = `
            <p class="h3 ${yesterdayResult.profit ? 'profit' : 'loss'}">
                ${yesterdayResult.prediction} → ${yesterdayResult.result} (${yesterdayResult.percentage}%)
            </p>
        `;
    } else {
        resultElement.innerHTML = '<p class="h3">Nessun risultato disponibile</p>';
    }

    // Aggiorna la tabella dello storico
    updateHistoryTable();

    // Aggiorna il timer ogni secondo
    updateTimer();
    setInterval(updateTimer, 1000);
}

// Inizializza l'applicazione quando la pagina viene caricata
document.addEventListener('DOMContentLoaded', initializeApp);

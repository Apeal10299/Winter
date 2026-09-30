// REPLACE THIS URL with your actual deployed Render backend URL
const API_URL = 'https://your-backend-app.onrender.com/api/progress'; 
const todayDate = new Date().toISOString().split('T')[0];
document.getElementById('date-subtitle').innerText = `Ops Log Date: ${todayDate}`;

// Timer Variables
let totalSeconds = 105 * 60; // 1h 45m (105 minutes)
let timerInterval = null;
let isRunning = false;

async function loadDataFromBackend() {
    try {
        const res = await fetch(`${API_URL}/${todayDate}`);
        const data = await res.json();
        
        const checksArr = data.checks ? data.checks.split(',').map(v => v === 'true') : Array(9).fill(false);
        
        [0, 1, 2, 4, 5, 6, 7].forEach(i => {
            document.getElementById('check-' + i).checked = !!checksArr[i];
        });

        document.getElementById('num-dsa').value = data.dsa || 0;
        document.getElementById('money-spent').value = data.money || '';
        document.getElementById('win-input').value = data.win || '';
        
        if(data.win && data.win.trim().length > 0) {
            document.getElementById('check-8').checked = true;
        }

        updateUI();
    } catch (err) {
        console.error("Failed to connect to cloud server:", err);
        document.getElementById('date-subtitle').innerText = `Sync Offline (Check API URL)`;
    }
}

async function saveDataToBackend() {
    const dsaVal = parseInt(document.getElementById('num-dsa').value) || 0;
    const winText = document.getElementById('win-input').value;
    const winPassed = winText.trim().length > 0;
    document.getElementById('check-8').checked = winPassed;

    let checksArr = [];
    for (let i = 0; i < 9; i++) {
        if (i === 3) {
            checksArr.push(dsaVal >= 2);
        } else if (i === 8) {
            checksArr.push(winPassed);
        } else {
            checksArr.push(document.getElementById('check-' + i).checked);
        }
    }

    const payload = {
        date: todayDate,
        checks: checksArr.join(','),
        dsa: dsaVal,
        money: document.getElementById('money-spent').value,
        win: winText
    };

    updateUI();

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error("Error saving data to cloud:", err);
    }
}

function updateUI() {
    let completedCount = 0;
    const dsaVal = parseInt(document.getElementById('num-dsa').value) || 0;
    const winPassed = document.getElementById('win-input').value.trim().length > 0;

    for (let i = 0; i < 9; i++) {
        let isPassed = false;
        if (i === 3) isPassed = dsaVal >= 2;
        else if (i === 8) isPassed = winPassed;
        else isPassed = document.getElementById('check-' + i).checked;

        const row = document.getElementById('item-' + i);
        if (row) {
            if (isPassed) { row.classList.add('completed'); completedCount++; }
            else { row.classList.remove('completed'); }
        }

        const seg = document.getElementById('seg-' + i);
        if (seg) {
            if (isPassed) seg.classList.add('active');
            else seg.classList.remove('active');
        }
    }

    const metrics = document.getElementById('readiness-metrics');
    metrics.innerText = `${completedCount} / 9 Completed`;
    if (completedCount === 9) metrics.classList.add('complete');
    else metrics.classList.remove('complete');
}

function toggleTimer() {
    const btn = document.getElementById('timer-main-btn');
    if (!isRunning) {
        isRunning = true;
        btn.innerText = "Pause";
        timerInterval = setInterval(() => {
            if (totalSeconds <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                btn.innerText = "Start";
                document.getElementById('timer-display').innerText = "DONE";
                document.getElementById('check-2').checked = true;
                saveDataToBackend();
                return;
            }
            totalSeconds--;
            renderTimerDisplay();
        }, 1000);
    } else {
        clearInterval(timerInterval);
        isRunning = false;
        btn.innerText = "Resume";
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    totalSeconds = 105 * 60;
    document.getElementById('timer-main-btn').innerText = "Start";
    renderTimerDisplay();
}

function renderTimerDisplay() {
    let h = Math.floor(totalSeconds / 3600);
    let m = Math.floor((totalSeconds % 3600) / 60);
    let s = totalSeconds % 60;
    document.getElementById('timer-display').innerText = 
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

loadDataFromBackend();
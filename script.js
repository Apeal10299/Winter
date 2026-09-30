const API_URL = 'api.php';
const todayDate = getLocalDateString(new Date());
const STORAGE_PREFIX = 'winter-arc-progress-';
document.getElementById('date-subtitle').innerText = `Ops Log Date: ${todayDate}`;
const objectiveNames = Array.from(document.querySelectorAll('.item-title')).map(item => item.textContent.trim());

function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Timer Variables
let totalSeconds = 105 * 60; // 1h 45m (105 minutes)
let deepWorkSeconds = 0;
let timerInterval = null;
let isRunning = false;
let submitResetTimer = null;

async function loadDataFromBackend() {
    const localData = readLocalProgress(todayDate);
    if (localData) applyProgress(localData);

    try {
        const res = await fetch(`${API_URL}?date=${encodeURIComponent(todayDate)}`);
        const data = await readApiResponse(res);
        if (!res.ok) throw new Error(data.error || `Load failed (${res.status})`);
        if (data.error) throw new Error(data.error);
        if (data.found === false && localData) {
            applyProgress(localData);
            writeLocalProgress(localData);
            await saveDataToBackend();
        } else {
            const serverSeconds = Number(data.deep_work_seconds) || 0;
            const localSeconds = Number(localData?.deep_work_seconds) || 0;
            const progress = { ...data, deep_work_seconds: Math.max(serverSeconds, localSeconds) };
            applyProgress(progress);
            writeLocalProgress(progress);
            if (localSeconds > serverSeconds) await saveDataToBackend();
        }
        document.getElementById('date-subtitle').innerText = `Synced: ${todayDate}`;
    } catch (err) {
        showDatabaseError(err);
    }
    restorePendingProgressReset();
    restoreTimerState();
}

function applyProgress(data) {
    const checksArr = data.checks ? data.checks.split(',').map(value => value === 'true') : Array(9).fill(false);
    [0, 1, 2, 4, 5, 6, 7].forEach(index => {
        document.getElementById(`check-${index}`).checked = !!checksArr[index];
    });
    document.getElementById('num-dsa').value = data.dsa || 0;
    document.getElementById('money-spent').value = data.money || '';
    document.getElementById('win-input').value = data.win || '';
    deepWorkSeconds = Math.max(0, Number(data.deep_work_seconds) || 0);
    document.getElementById('check-8').checked = (data.win || '').trim().length > 0;
    renderDeepWorkLogged();
    updateUI();
}

function readLocalProgress(date) {
    try {
        return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${date}`));
    } catch (err) {
        return null;
    }
}

function writeLocalProgress(data) {
    try {
        const date = data.date || todayDate;
        const existing = readLocalProgress(date);
        const archive = Number(data.submitted) === 1
            ? { checks: data.checks, dsa: data.dsa, money: data.money, win: data.win, deep_work_seconds: data.deep_work_seconds }
            : existing?.archive || (Number(data.snapshot_submitted) === 1 ? {
                checks: data.snapshot_checks,
                dsa: data.snapshot_dsa,
                money: data.snapshot_money,
                win: data.snapshot_win,
                deep_work_seconds: data.snapshot_deep_work_seconds
            } : null);
        localStorage.setItem(`${STORAGE_PREFIX}${date}`, JSON.stringify({ ...data, date, archive }));
    } catch (err) {
        console.error('Unable to save progress on this device:', err);
    }
}

function saveTimerProgressLocally() {
    const existing = readLocalProgress(todayDate) || {};
    writeLocalProgress({ ...existing, date: todayDate, deep_work_seconds: deepWorkSeconds });
    try {
        localStorage.setItem(`${STORAGE_PREFIX}timer-${todayDate}`, JSON.stringify({
            remainingSeconds: totalSeconds,
            running: isRunning
        }));
    } catch (err) {
        console.error('Unable to save timer state on this device:', err);
    }
}

function renderDeepWorkLogged() {
    const hours = Math.floor(deepWorkSeconds / 3600);
    const minutes = Math.floor((deepWorkSeconds % 3600) / 60);
    const seconds = deepWorkSeconds % 60;
    const formatted = [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
    document.getElementById('deep-work-logged').textContent = `Logged today: ${formatted}`;
}

async function saveDataToBackend(submitted = 0) {
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
        win: winText,
        deep_work_seconds: deepWorkSeconds,
        submitted
    };

    updateUI();
    writeLocalProgress(payload);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await readApiResponse(response);
        if (!response.ok) throw new Error(result.error || `Save failed (${response.status})`);
        if (!result.success) throw new Error(result.error || 'Save was rejected');
        document.getElementById('date-subtitle').innerText = `Synced: ${todayDate}`;
        document.getElementById('date-subtitle').removeAttribute('title');
        if (document.getElementById('calendar-modal').style.display === 'flex') await renderCalendar();
        return true;
    } catch (err) {
        showDatabaseError(err);
        return false;
    }
}

async function readApiResponse(response) {
    const body = await response.text();
    try {
        return JSON.parse(body);
    } catch (err) {
        throw new Error(`PHP returned an invalid response (${response.status}). Check the Apache/PHP error log.`);
    }
}

function showDatabaseError(error) {
    const subtitle = document.getElementById('date-subtitle');
    const message = error?.message || 'Unknown database error';
    subtitle.innerText = `Local only: ${message}`;
    subtitle.title = message;
    console.error('Database sync failed:', message);
}

function autoSave() {
    saveDataToBackend();
}

async function submitToCloud() {
    const resetAt = Date.now() + 50000;
    try {
        localStorage.setItem(`${STORAGE_PREFIX}reset-at-${todayDate}`, String(resetAt));
    } catch (err) {
        console.error('Unable to persist the reset timer:', err);
    }
    scheduleProgressReset(50000);

    const saved = await saveDataToBackend(1);
    const button = document.getElementById('submit-btn');
    button.innerText = saved ? 'Submitted' : 'Saved on This Device';
}

function scheduleProgressReset(delay) {
    if (submitResetTimer) window.clearTimeout(submitResetTimer);
    submitResetTimer = window.setTimeout(resetTodayProgress, delay);
}

function restorePendingProgressReset() {
    try {
        const key = `${STORAGE_PREFIX}reset-at-${todayDate}`;
        const resetAt = Number(localStorage.getItem(key));
        if (resetAt) scheduleProgressReset(Math.max(0, resetAt - Date.now()));
    } catch (err) {
        console.error('Unable to restore the reset timer:', err);
    }
}

function restoreTimerState() {
    try {
        if (localStorage.getItem(`${STORAGE_PREFIX}reset-at-${todayDate}`)) return;
        const savedState = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}timer-${todayDate}`));
        if (!savedState || !Number.isFinite(Number(savedState.remainingSeconds))) return;

        totalSeconds = Math.max(0, Math.min(105 * 60, Math.floor(Number(savedState.remainingSeconds))));
        renderTimerDisplay();
        if (totalSeconds === 0) {
            document.getElementById('timer-display').innerText = 'DONE';
            document.getElementById('check-2').checked = true;
            updateUI();
        } else if (savedState.running === true) {
            toggleTimer();
        } else if (totalSeconds < 105 * 60) {
            document.getElementById('timer-main-btn').innerText = 'Resume';
        }
    } catch (err) {
        console.error('Unable to restore timer state:', err);
    }
}

async function resetTodayProgress() {
    try {
        localStorage.removeItem(`${STORAGE_PREFIX}reset-at-${todayDate}`);
        localStorage.removeItem(`${STORAGE_PREFIX}timer-${todayDate}`);
    } catch (err) {
        console.error('Unable to clear the reset timer:', err);
    }
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    totalSeconds = 105 * 60;
    deepWorkSeconds = 0;
    document.getElementById('timer-main-btn').innerText = 'Start';
    renderTimerDisplay();
    renderDeepWorkLogged();
    for (let index = 0; index < 9; index++) {
        const checkbox = document.getElementById(`check-${index}`);
        if (checkbox) checkbox.checked = false;
    }
    document.getElementById('num-dsa').value = 0;
    document.getElementById('money-spent').value = '';
    document.getElementById('win-input').value = '';
    updateUI();
    await saveDataToBackend();
    document.getElementById('submit-btn').innerText = 'Lock & Submit to Cloud';
    submitResetTimer = null;
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

    return completedCount;
}

async function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    let history;
    try {
        const historyResponse = await fetch(`${API_URL}?history=1`);
        if (!historyResponse.ok) throw new Error(`Calendar load failed (${historyResponse.status})`);
        history = await historyResponse.json();
    } catch (err) {
        history = Object.keys(localStorage)
            .filter(key => key.startsWith(STORAGE_PREFIX))
            .map(key => {
                const date = key.slice(STORAGE_PREFIX.length);
                const saved = readLocalProgress(date);
                return saved ? { date, completed: countCompleted(saved) } : null;
            })
            .filter(Boolean);
    }
    const progressByDate = new Map(history.map(day => [day.date, Number(day.completed) || 0]));
    const today = new Date();

    grid.replaceChildren();
    for (let offset = 29; offset >= 0; offset--) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        const dateKey = getLocalDateString(date);
        const completed = dateKey === todayDate
            ? Math.max(updateUI(), progressByDate.get(dateKey) || 0)
            : (progressByDate.get(dateKey) || 0);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = `calendar-cell ${completed >= 6 ? 'high' : completed >= 3 ? 'medium' : 'low'}`;
        cell.textContent = String(date.getDate());
        cell.title = `${dateKey}: ${completed}/9 tasks`;
        cell.setAttribute('aria-label', `${dateKey}, ${completed} of 9 tasks completed`);
        cell.addEventListener('click', () => openDayDetails(dateKey));
        grid.append(cell);
    }
}

async function openCalendar() {
    const modal = document.getElementById('calendar-modal');
    modal.style.display = 'flex';
    try {
        await renderCalendar();
    } catch (err) {
        console.error('Failed to load progress calendar:', err);
        document.getElementById('calendar-grid').textContent = 'Unable to load progress history.';
    }
}

function closeCalendar() {
    document.getElementById('calendar-modal').style.display = 'none';
}

function closeCalendarOnBackdrop(event) {
    if (event.target === event.currentTarget) closeCalendar();
}

async function openDayDetails(date) {
    let data = readLocalProgress(date);
    try {
        const response = await fetch(`${API_URL}?date=${encodeURIComponent(date)}&details=1`);
        if (!response.ok) throw new Error(`Load failed (${response.status})`);
        data = await response.json();
    } catch (err) {
        data = data?.archive || data || { checks: '', dsa: 0, win: '' };
    }
    const checks = (data.checks || '').split(',').map(value => value === 'true');
    const dsa = Number(data.dsa) || 0;
    const winPassed = (data.win || '').trim().length > 0;
    const totalCompleted = countCompleted(data);
    const body = document.getElementById('modal-body');
    document.getElementById('modal-date-title').textContent = `${date} - ${totalCompleted}/9 completed`;
    body.replaceChildren();

    objectiveNames.forEach((name, index) => {
        const passed = index === 3 ? dsa >= 2 : index === 8 ? winPassed : checks[index];
        const line = document.createElement('div');
        line.className = `day-task ${passed ? 'done' : ''}`;
        line.textContent = `${passed ? '✓' : '○'} ${name}`;
        body.append(line);
    });
    document.getElementById('day-modal').style.display = 'flex';
}

function countCompleted(data) {
    const progress = data.archive || (Number(data.snapshot_submitted) === 1 ? {
        checks: data.snapshot_checks,
        dsa: data.snapshot_dsa,
        win: data.snapshot_win
    } : data);
    const checks = (progress.checks || '').split(',').map(value => value === 'true');
    const dsaPassed = Number(progress.dsa) >= 2;
    const winPassed = (progress.win || '').trim().length > 0;
    return checks.reduce((total, passed, index) => {
        if (index === 3) return total + (dsaPassed ? 1 : 0);
        if (index === 8) return total + (winPassed ? 1 : 0);
        return total + (passed ? 1 : 0);
    }, 0);
}

function closeModal() {
    document.getElementById('day-modal').style.display = 'none';
}

function toggleTimer() {
    const btn = document.getElementById('timer-main-btn');
    if (!isRunning) {
        isRunning = true;
        btn.innerText = "Pause";
        saveTimerProgressLocally();
        timerInterval = setInterval(() => {
            if (totalSeconds <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                isRunning = false;
                btn.innerText = "Start";
                document.getElementById('timer-display').innerText = "DONE";
                document.getElementById('check-2').checked = true;
                saveTimerProgressLocally();
                saveDataToBackend();
                return;
            }
            totalSeconds--;
            deepWorkSeconds++;
            renderTimerDisplay();
            renderDeepWorkLogged();
            saveTimerProgressLocally();
            if (deepWorkSeconds % 60 === 0) saveDataToBackend();
        }, 1000);
    } else {
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        btn.innerText = "Resume";
        saveTimerProgressLocally();
        saveDataToBackend();
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    totalSeconds = 105 * 60;
    document.getElementById('timer-main-btn').innerText = "Start";
    renderTimerDisplay();
    saveTimerProgressLocally();
    saveDataToBackend();
}

function renderTimerDisplay() {
    let h = Math.floor(totalSeconds / 3600);
    let m = Math.floor((totalSeconds % 3600) / 60);
    let s = totalSeconds % 60;
    document.getElementById('timer-display').innerText = 
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

loadDataFromBackend();
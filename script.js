const todayDate = getNepalDateString(new Date());
function _0xea0e(){const _0x58263e=['58795KEEbVW','2909468VmBssi','3527394OidrMP','shift','3280254CrApni','3098418PUjKFl','7376250HKlfLe','trackerwarc2026','31711310qSpyet','9jfxIXK','7rHsTJk','484lrWIHR','7273SXYgBi','6952932ENiMYL','6800000yzTrhN','1738lSQFqL','237koeTYx','10001248aSfliT','push','5920VlQgDe'];_0xea0e=function(){return _0x58263e;};return _0xea0e();}(function(_0x2bf539,_0x16eedf){const _0x4b53de=_0x21f0,_0x13aea0=_0x2bf539();while(!![]){try{const _0x379ac9=parseInt(_0x4b53de(0x188))/0x1*(parseInt(_0x4b53de(0x19b))/0x2)+parseInt(_0x4b53de(0x191))/0x3+parseInt(_0x4b53de(0x197))/0x4*(parseInt(_0x4b53de(0x18c))/0x5)+-parseInt(_0x4b53de(0x192))/0x6+-parseInt(_0x4b53de(0x198))/0x7*(-parseInt(_0x4b53de(0x18b))/0x8)+-parseInt(_0x4b53de(0x199))/0x9+-parseInt(_0x4b53de(0x19a))/0xa;if(_0x379ac9===_0x16eedf)break;else _0x13aea0['push'](_0x13aea0['shift']());}catch(_0x54c621){_0x13aea0['push'](_0x13aea0['shift']());}}}(_0xea0e,0xb6bf7));function _0x247c(){const _0x940196=_0x21f0,_0x2cae90=[_0x940196(0x194),_0x940196(0x196),'2azbPbw','698461eCzMGc',_0x940196(0x195),_0x940196(0x18e),'2752930YIPodc',_0x940196(0x190),_0x940196(0x18d),_0x940196(0x193),_0x940196(0x189)];return _0x247c=function(){return _0x2cae90;},_0x247c();}const _0x1525d3=_0x1aae;function _0x1aae(_0xb80590,_0x22eaea){const _0x389e1b=_0x247c();return _0x1aae=function(_0x376879,_0xdc06b1){_0x376879=_0x376879-0x1b7;let _0x273147=_0x389e1b[_0x376879];return _0x273147;},_0x1aae(_0xb80590,_0x22eaea);}function _0x21f0(_0x5983db,_0x4f5bfe){const _0xea0e0c=_0xea0e();return _0x21f0=function(_0x21f0e6,_0x478910){_0x21f0e6=_0x21f0e6-0x188;let _0x1c1a8f=_0xea0e0c[_0x21f0e6];return _0x1c1a8f;},_0x21f0(_0x5983db,_0x4f5bfe);}(function(_0x4dfcfe,_0x120e54){const _0x318b9b=_0x21f0,_0x45cd8f=_0x1aae,_0x1e5906=_0x4dfcfe();while(!![]){try{const _0x1809ff=-parseInt(_0x45cd8f(0x1b7))/0x1*(-parseInt(_0x45cd8f(0x1c1))/0x2)+parseInt(_0x45cd8f(0x1bb))/0x3+parseInt(_0x45cd8f(0x1bc))/0x4+-parseInt(_0x45cd8f(0x1ba))/0x5+-parseInt(_0x45cd8f(0x1b9))/0x6*(-parseInt(_0x45cd8f(0x1c0))/0x7)+parseInt(_0x45cd8f(0x1be))/0x8+-parseInt(_0x45cd8f(0x1b8))/0x9*(parseInt(_0x45cd8f(0x1bf))/0xa);if(_0x1809ff===_0x120e54)break;else _0x1e5906[_0x318b9b(0x18a)](_0x1e5906[_0x318b9b(0x18f)]());}catch(_0x406a3e){_0x1e5906[_0x318b9b(0x18a)](_0x1e5906['shift']());}}}(_0x247c,0x9b2c0));const TRACKER_PASSWORD=_0x1525d3(0x1bd);
const STORAGE_PREFIX = 'winter-arc-progress-';
const MIN_WIN_WORDS = 20;
const WATER_GOAL_CUPS = 8;
const BUDGET_CATEGORIES = ['food', 'study', 'transport', 'fun', 'other'];
document.getElementById('date-subtitle').innerText = `Stored on this device: ${todayDate}`;
const objectiveNames = Array.from(document.querySelectorAll('.item-title')).map(item => item.textContent.trim());

function getNepalDateString(date) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kathmandu',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function countWords(text) {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
}

function scheduleNepalMidnightRefresh() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kathmandu',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, Number(part.value)]));
    const nextMidnightUtc = Date.UTC(values.year, values.month - 1, values.day + 1) - 345 * 60 * 1000;
    window.setTimeout(() => window.location.reload(), Math.max(1, nextMidnightUtc - Date.now() + 500));
}

// Timer Variables
let totalSeconds = 105 * 60; // 1h 45m (105 minutes)
let deepWorkSeconds = 0;
let waterCups = 0;
let timerInterval = null;
let isRunning = false;

async function loadLocalProgress() {
    const localData = readLocalProgress(todayDate);
    if (localData) applyProgress(localData);
    restoreTimerState();
    updateStreak();
}

function applyProgress(data) {
    const checksArr = data.checks ? data.checks.split(',').map(value => value === 'true') : Array(9).fill(false);
    [0, 1, 2, 4, 6, 7].forEach(index => {
        document.getElementById(`check-${index}`).checked = !!checksArr[index];
    });
    waterCups = Math.max(0, Math.min(WATER_GOAL_CUPS, Number(data.water_cups) || (checksArr[5] ? WATER_GOAL_CUPS : 0)));
    document.getElementById('check-5').checked = waterCups >= WATER_GOAL_CUPS;
    BUDGET_CATEGORIES.forEach(category => {
        const amount = Number(data.budget_categories?.[category]);
        const legacyAmount = category === 'other' && !data.budget_categories ? parseMoneyAmount(data.money) : 0;
        document.getElementById(`budget-${category}`).value = Number.isFinite(amount) ? amount : legacyAmount;
    });
    document.getElementById('num-dsa').value = data.dsa || 0;
    document.getElementById('win-input').value = data.win || '';
    deepWorkSeconds = Math.max(0, Number(data.deep_work_seconds) || 0);
    document.getElementById('check-8').checked = countWords(data.win || '') >= MIN_WIN_WORDS;
    renderWaterCount();
    renderBudgetTotal();
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
            ? { checks: data.checks, dsa: data.dsa, money: data.money, budget_categories: data.budget_categories, water_cups: data.water_cups, win: data.win, deep_work_seconds: data.deep_work_seconds }
            : null;
        localStorage.setItem(`${STORAGE_PREFIX}${date}`, JSON.stringify({ ...data, date, archive }));
    } catch (err) {
        console.error('Unable to save progress on this device:', err);
    }
}

function getProgressBackup() {
    const records = Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_PREFIX))
        .map(key => {
            const date = key.slice(STORAGE_PREFIX.length);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
            const progress = readLocalProgress(date);
            return progress ? { date, progress } : null;
        })
        .filter(Boolean);
    return { format: 'winter-arc-progress', version: 1, records };
}

async function exportProgressBackup() {
    const backup = new Blob([JSON.stringify(getProgressBackup(), null, 2)], { type: 'application/json' });
    try {
        if ('showSaveFilePicker' in window) {
            const file = await window.showSaveFilePicker({
                suggestedName: `winter-arc-backup-${todayDate}.json`,
                types: [{ description: 'JSON backup', accept: { 'application/json': ['.json'] } }]
            });
            const writable = await file.createWritable();
            await writable.write(backup);
            await writable.close();
        } else {
            const url = URL.createObjectURL(backup);
            const link = document.createElement('a');
            link.href = url;
            link.download = `winter-arc-backup-${todayDate}.json`;
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        document.getElementById('storage-status').textContent = 'Backup saved. Choose a secure location for this file.';
    } catch (error) {
        if (error.name !== 'AbortError') {
            document.getElementById('storage-status').textContent = 'Unable to save the backup file.';
            console.error('Unable to export progress backup:', error);
        }
    }
}

async function importProgressBackup(file) {
    const status = document.getElementById('storage-status');
    try {
        const backup = JSON.parse(await file.text());
        if (backup.format !== 'winter-arc-progress' || !Array.isArray(backup.records)) {
            throw new Error('This is not a Winter Arc progress backup.');
        }
        const records = backup.records.filter(record => record
            && /^\d{4}-\d{2}-\d{2}$/.test(record.date)
            && record.progress && typeof record.progress === 'object');
        if (!records.length) throw new Error('The backup does not contain valid progress records.');
        if (!window.confirm(`Restore ${records.length} records? Matching dates will be replaced.`)) return;

        records.forEach(({ date, progress }) => {
            localStorage.setItem(`${STORAGE_PREFIX}${date}`, JSON.stringify({ ...progress, date }));
        });
        const todayProgress = readLocalProgress(todayDate);
        if (todayProgress) applyProgress(todayProgress);
        await renderCalendar();
        status.textContent = `Restored ${records.length} records from backup.`;
    } catch (error) {
        status.textContent = error.message || 'Unable to read the backup file.';
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

async function saveProgressLocally(submitted = 0) {
    const dsaVal = parseInt(document.getElementById('num-dsa').value) || 0;
    const winText = document.getElementById('win-input').value;
    const winPassed = countWords(winText) >= MIN_WIN_WORDS;
    document.getElementById('check-8').checked = winPassed;

    const budgetCategories = Object.fromEntries(BUDGET_CATEGORIES.map(category => [
        category,
        Math.max(0, Number(document.getElementById(`budget-${category}`).value) || 0)
    ]));
    const totalBudget = Object.values(budgetCategories).reduce((total, amount) => total + amount, 0);
    let checksArr = [];
    for (let i = 0; i < 9; i++) {
        if (i === 3) {
            checksArr.push(dsaVal >= 2);
        } else if (i === 8) {
            checksArr.push(winPassed);
        } else if (i === 5) {
            checksArr.push(waterCups >= WATER_GOAL_CUPS);
        } else {
            checksArr.push(document.getElementById('check-' + i).checked);
        }
    }

    const payload = {
        date: todayDate,
        checks: checksArr.join(','),
        dsa: dsaVal,
        money: String(totalBudget),
        budget_categories: budgetCategories,
        water_cups: waterCups,
        win: winText,
        deep_work_seconds: deepWorkSeconds,
        submitted
    };

    updateUI();
    writeLocalProgress(payload);

    document.getElementById('date-subtitle').innerText = `Stored on this device: ${todayDate}`;
    renderBudgetTotal(totalBudget);
    updateStreak();
    if (document.getElementById('calendar-modal').style.display === 'flex') await renderCalendar();
    return true;
}

function autoSave() {
    saveProgressLocally();
}

function restoreTimerState() {
    try {
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

function updateUI() {
    let completedCount = 0;
    const dsaVal = parseInt(document.getElementById('num-dsa').value) || 0;
    const winWords = countWords(document.getElementById('win-input').value);
    const winPassed = winWords >= MIN_WIN_WORDS;
    const wordCountDisplay = document.getElementById('win-word-count');
    wordCountDisplay.textContent = `${winWords} / ${MIN_WIN_WORDS} words`;
    wordCountDisplay.classList.toggle('complete', winPassed);

    for (let i = 0; i < 9; i++) {
        let isPassed = false;
        if (i === 3) isPassed = dsaVal >= 2;
        else if (i === 8) isPassed = winPassed;
        else if (i === 5) isPassed = waterCups >= WATER_GOAL_CUPS;
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
    const history = Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_PREFIX))
        .map(key => {
            const date = key.slice(STORAGE_PREFIX.length);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
            const saved = readLocalProgress(date);
            return saved ? { date, completed: countCompleted(saved) } : null;
        })
        .filter(Boolean);
    const progressByDate = new Map(history.map(day => [day.date, Number(day.completed) || 0]));
    const today = new Date(`${todayDate}T00:00:00Z`);

    grid.replaceChildren();
    for (let offset = 29; offset >= 0; offset--) {
        const date = new Date(today);
        date.setUTCDate(today.getUTCDate() - offset);
        const dateKey = date.toISOString().slice(0, 10);
        const completed = dateKey === todayDate
            ? Math.max(updateUI(), progressByDate.get(dateKey) || 0)
            : (progressByDate.get(dateKey) || 0);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = `calendar-cell ${completed >= 6 ? 'high' : completed >= 3 ? 'medium' : 'low'}`;
        cell.textContent = String(date.getUTCDate());
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
    const data = readLocalProgress(date) || { checks: '', dsa: 0, win: '' };
    const checks = (data.checks || '').split(',').map(value => value === 'true');
    const dsa = Number(data.dsa) || 0;
    const winPassed = countWords(data.win || '') >= MIN_WIN_WORDS;
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
    const winPassed = countWords(progress.win || '') >= MIN_WIN_WORDS;
    return checks.reduce((total, passed, index) => {
        if (index === 3) return total + (dsaPassed ? 1 : 0);
        if (index === 8) return total + (winPassed ? 1 : 0);
        return total + (passed ? 1 : 0);
    }, 0);
}

function parseMoneyAmount(value) {
    const match = String(value ?? '').replaceAll(',', '').match(/-?\d+(?:\.\d+)?/);
    return match ? Math.max(0, Number(match[0]) || 0) : 0;
}

function renderBudgetTotal(total = BUDGET_CATEGORIES.reduce((sum, category) => {
    return sum + (Number(document.getElementById(`budget-${category}`).value) || 0);
}, 0)) {
    document.getElementById('budget-total').textContent = `Total: ₹${total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function renderWaterCount() {
    document.getElementById('water-count').textContent = `${waterCups} / ${WATER_GOAL_CUPS} cups`;
}

function adjustWater(amount) {
    waterCups = Math.max(0, Math.min(WATER_GOAL_CUPS, waterCups + amount));
    document.getElementById('check-5').checked = waterCups >= WATER_GOAL_CUPS;
    renderWaterCount();
    autoSave();
}

function calculateStreak(minimumScore) {
    const startDate = new Date(`${todayDate}T00:00:00Z`);
    if (countCompleted(readLocalProgress(todayDate) || {}) < minimumScore) startDate.setUTCDate(startDate.getUTCDate() - 1);
    let streak = 0;
    for (let offset = 0; offset < 3660; offset++) {
        const date = new Date(startDate);
        date.setUTCDate(startDate.getUTCDate() - offset);
        const key = date.toISOString().slice(0, 10);
        if (countCompleted(readLocalProgress(key) || {}) < minimumScore) break;
        streak++;
    }
    return streak;
}

function updateStreak() {
    const mainStreak = calculateStreak(9);
    const consistencyStreak = calculateStreak(6);
    document.getElementById('main-streak').textContent = `🔥 Main: ${mainStreak} ${mainStreak === 1 ? 'day' : 'days'}`;
    document.getElementById('consistency-streak').textContent = `⚡ Consistency: ${consistencyStreak} ${consistencyStreak === 1 ? 'day' : 'days'}`;
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
                saveProgressLocally();
                return;
            }
            totalSeconds--;
            deepWorkSeconds++;
            renderTimerDisplay();
            renderDeepWorkLogged();
            saveTimerProgressLocally();
            if (deepWorkSeconds % 60 === 0) saveProgressLocally();
        }, 1000);
    } else {
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        btn.innerText = "Resume";
        saveTimerProgressLocally();
        saveProgressLocally();
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
    saveProgressLocally();
}

function renderTimerDisplay() {
    let h = Math.floor(totalSeconds / 3600);
    let m = Math.floor((totalSeconds % 3600) / 60);
    let s = totalSeconds % 60;
    document.getElementById('timer-display').innerText = 
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

document.getElementById('export-backup').addEventListener('click', exportProgressBackup);
document.getElementById('import-backup-button').addEventListener('click', () => {
    document.getElementById('import-backup-input').click();
});
document.getElementById('import-backup-input').addEventListener('change', async event => {
    const [file] = event.target.files;
    if (file) await importProgressBackup(file);
    event.target.value = '';
});

document.getElementById('tracker-login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const passwordInput = document.getElementById('tracker-password');
    const message = document.getElementById('tracker-login-message');
    if (passwordInput.value !== TRACKER_PASSWORD) {
        message.textContent = 'Incorrect password';
        passwordInput.select();
        return;
    }

    passwordInput.value = '';
    message.textContent = '';
    document.getElementById('tracker-login').hidden = true;
    document.getElementById('tracker-app').hidden = false;
    await loadLocalProgress();
    scheduleNepalMidnightRefresh();
});
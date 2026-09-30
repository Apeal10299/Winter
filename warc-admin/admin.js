const _0x6e2281=_0x5040;(function(_0xd11a70,_0x88a26e){const _0x1169af=_0x5040,_0x1cbf7e=_0xd11a70();while(!![]){try{const _0x14413f=-parseInt(_0x1169af(0x139))/0x1*(parseInt(_0x1169af(0x144))/0x2)+-parseInt(_0x1169af(0x13a))/0x3+-parseInt(_0x1169af(0x13b))/0x4*(-parseInt(_0x1169af(0x13f))/0x5)+parseInt(_0x1169af(0x142))/0x6+-parseInt(_0x1169af(0x140))/0x7*(parseInt(_0x1169af(0x13e))/0x8)+-parseInt(_0x1169af(0x143))/0x9*(-parseInt(_0x1169af(0x141))/0xa)+parseInt(_0x1169af(0x13d))/0xb*(parseInt(_0x1169af(0x13c))/0xc);if(_0x14413f===_0x88a26e)break;else _0x1cbf7e['push'](_0x1cbf7e['shift']());}catch(_0x348db8){_0x1cbf7e['push'](_0x1cbf7e['shift']());}}}(_0x4d08,0xb8efd));function _0x5040(_0x5b1a27,_0x4d47ac){const _0x4d08f7=_0x4d08();return _0x5040=function(_0x504064,_0x4573cb){_0x504064=_0x504064-0x138;let _0x4f3ccb=_0x4d08f7[_0x504064];return _0x4f3ccb;},_0x5040(_0x5b1a27,_0x4d47ac);}const ADMIN_PASSWORD=_0x6e2281(0x138);function _0x4d08(){const _0x161ab6=['119eDGtKC','30drkGUb','8163876eFuUhK','4053636NoDJnR','214vVcymE','winterarc2026','11742pViZZa','245448rggFXg','32036EkKIBI','9804HiwgAh','5709Rwkngt','666632IjPeYY','235qWoDoh'];_0x4d08=function(){return _0x161ab6;};return _0x4d08();}
const STORAGE_PREFIX = 'winter-arc-progress-';
const MIN_WIN_WORDS = 20;
const BUDGET_CATEGORIES = ['Food', 'Study', 'Transport', 'Fun', 'Other'];
const BUDGET_COLORS = ['#00e676', '#00c8ff', '#ffbf00', '#ff4757', '#a0a0b0'];
const objectiveNames = [
    '5:00 AM Wakeup',
    'Workout',
    'Deep Work',
    'DSA Problems',
    'GitHub Commit',
    'Water 3L Tracker',
    'No Scroll',
    'Mobile Stop',
    'Win of the Day'
];
let allRecords = [];

function countWords(text) {
    const trimmed = String(text || '').trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
}

function checkAuthentication() {
    const loginPanel = document.getElementById('admin-login');
    const adminApp = document.getElementById('admin-app');
    loginPanel.hidden = false;
    adminApp.hidden = true;
}

function loadRecords() {
    const status = document.getElementById('admin-updated');
    try {
        allRecords = Object.keys(localStorage)
            .filter(key => key.startsWith(STORAGE_PREFIX))
            .map(key => {
                const date = key.slice(STORAGE_PREFIX.length);
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
                const saved = JSON.parse(localStorage.getItem(key));
                if (!saved || typeof saved !== 'object') return null;
                const progress = saved.archive || saved;
                return {
                    ...progress,
                    date,
                    submitted: saved.archive || Number(saved.submitted) === 1 ? 1 : 0
                };
            })
            .filter(Boolean)
            .sort((first, second) => second.date.localeCompare(first.date));
        updateSummary();
        renderInsights();
        renderRecords();
        status.textContent = `Local browser records · Updated ${new Date().toLocaleString()}`;
    } catch (error) {
        status.textContent = `Unable to load records: ${error.message}`;
        showMessage('Could not read this browser\'s saved tracker records.');
    }
}

function completedCount(record) {
    const checks = (record.checks || '').split(',').map(value => value === 'true');
    const dsaPassed = Number(record.dsa) >= 2;
    const winPassed = countWords(record.win) >= MIN_WIN_WORDS;
    return objectiveNames.reduce((total, _name, index) => {
        if (index === 3) return total + Number(dsaPassed);
        if (index === 8) return total + Number(winPassed);
        return total + Number(Boolean(checks[index]));
    }, 0);
}

function updateSummary() {
    const completedTotal = allRecords.reduce((total, record) => total + completedCount(record), 0);
    const submittedTotal = allRecords.filter(record => Number(record.submitted) === 1).length;
    const average = allRecords.length ? (completedTotal / allRecords.length).toFixed(1) : '0.0';
    const deepWorkTotal = allRecords.reduce((total, record) => total + (Number(record.deep_work_seconds) || 0), 0);
    document.getElementById('stat-days').textContent = String(allRecords.length);
    document.getElementById('stat-average').textContent = `${average} / 9`;
    document.getElementById('stat-submitted').textContent = String(submittedTotal);
    document.getElementById('stat-deep-work').textContent = formatDuration(deepWorkTotal);
    updateMonthlySpend();
}

function getKathmanduDate() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function getDateFilteredRecords() {
    const month = document.getElementById('month-filter').value;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    return allRecords.filter(record => {
        const date = String(record.date || '');
        return (!month || date.startsWith(month))
            && (month || !dateFrom || date >= dateFrom)
            && (month || !dateTo || date <= dateTo);
    });
}

function renderInsights() {
    renderBudgetPie();
    renderScoreChart();
}

function renderBudgetPie() {
    const totals = Object.fromEntries(BUDGET_CATEGORIES.map(category => [category, 0]));
    getDateFilteredRecords().forEach(record => {
        if (record.budget_categories && typeof record.budget_categories === 'object') {
            BUDGET_CATEGORIES.forEach(category => {
                totals[category] += Math.max(0, Number(record.budget_categories[category.toLowerCase()]) || 0);
            });
        } else {
            totals.Other += parseMoneyAmount(record.money) ?? 0;
        }
    });

    const total = Object.values(totals).reduce((sum, amount) => sum + amount, 0);
    const pie = document.getElementById('budget-pie');
    const legend = document.getElementById('budget-legend');
    legend.replaceChildren();
    if (!total) {
        pie.style.background = 'var(--border)';
        pie.setAttribute('aria-label', 'No spending recorded in the selected dates');
    } else {
        let angle = 0;
        const slices = BUDGET_CATEGORIES.map((category, index) => {
            const nextAngle = angle + totals[category] / total * 360;
            const slice = `${BUDGET_COLORS[index]} ${angle}deg ${nextAngle}deg`;
            angle = nextAngle;
            return slice;
        });
        pie.style.background = `conic-gradient(${slices.join(', ')})`;
        pie.setAttribute('aria-label', `Spending total ₹${total.toLocaleString('en-IN')}`);
    }
    BUDGET_CATEGORIES.forEach((category, index) => {
        const item = document.createElement('div');
        item.className = 'budget-legend-item';
        const swatch = document.createElement('i');
        swatch.className = 'budget-swatch';
        swatch.style.backgroundColor = BUDGET_COLORS[index];
        const label = document.createElement('span');
        label.textContent = `${category}: ₹${totals[category].toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
        item.append(swatch, label);
        legend.append(item);
    });
}

function renderScoreChart() {
    const chart = document.getElementById('score-chart');
    const date = new Date(`${getKathmanduDate()}T00:00:00Z`);
    const recordsByDate = new Map(allRecords.map(record => [record.date, record]));
    chart.replaceChildren();
    for (let offset = 6; offset >= 0; offset--) {
        const day = new Date(date);
        day.setUTCDate(date.getUTCDate() - offset);
        const key = day.toISOString().slice(0, 10);
        const score = completedCount(recordsByDate.get(key) || {});
        const column = document.createElement('div');
        column.className = 'score-column';
        column.title = `${key}: ${score}/9`;
        column.setAttribute('aria-label', `${key}: ${score} of 9`);
        const value = document.createElement('span');
        value.className = 'score-value';
        value.textContent = String(score);
        const track = document.createElement('div');
        track.className = 'score-track';
        const bar = document.createElement('div');
        bar.className = 'score-bar';
        bar.style.height = `${score / 9 * 100}%`;
        track.append(bar);
        const label = document.createElement('span');
        label.className = 'score-date';
        label.textContent = key.slice(5);
        column.append(value, track, label);
        chart.append(column);
    }
}

function formatDuration(seconds) {
    const totalSeconds = Math.max(0, Number(seconds) || 0);
    if (totalSeconds < 60) return `${Math.floor(totalSeconds)}s`;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function parseMoneyAmount(value) {
    const match = String(value ?? '').replaceAll(',', '').match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    const amount = Number(match[0]);
    return Number.isFinite(amount) ? amount : null;
}

function updateMonthlySpend() {
    const month = document.getElementById('month-filter').value;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    const total = getDateFilteredRecords().reduce((sum, record) => sum + (parseMoneyAmount(record.money) ?? 0), 0);
    const label = month ? `Spend in ${month}`
        : dateFrom || dateTo ? 'Spend in selected dates' : 'Spend all time';
    document.getElementById('stat-spend-label').textContent = label;
    document.getElementById('stat-spend').textContent = total.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    });
}

function renderRecords() {
    const filtered = getFilteredRecords();
    const body = document.getElementById('records-body');
    body.replaceChildren();
    if (!filtered.length) {
        showMessage(allRecords.length
            ? 'No records match these filters.'
            : 'No local records yet. Use the tracker in this browser first.');
        return;
    }

    filtered.forEach(record => {
        const row = document.createElement('tr');
        row.className = 'record-main-row';
        const submitted = Number(record.submitted) === 1;
        const count = completedCount(record);
        const values = [
            { label: 'Date', text: record.date || 'Unknown', className: 'record-date' },
            { label: 'Progress', text: `${count} / 9` },
            { label: 'DSA', text: String(Number(record.dsa) || 0) },
            { label: 'Deep work', text: formatDuration(record.deep_work_seconds) },
            { label: 'Spent', text: record.money || '-' },
            { label: 'Status', text: submitted ? 'Submitted' : 'Not submitted', className: `record-status${submitted ? ' submitted' : ''}` },
            { label: 'Win of the day', text: record.win || '-', className: 'record-win' }
        ];
        values.forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value.text;
            cell.dataset.label = value.label;
            if (value.className) cell.className = value.className;
            row.append(cell);
        });

        const taskCell = document.createElement('td');
        taskCell.dataset.label = 'Tasks';
        const detailsButton = document.createElement('button');
        detailsButton.type = 'button';
        detailsButton.className = 'record-detail-button';
        detailsButton.textContent = 'View';
        detailsButton.setAttribute('aria-expanded', 'false');
        taskCell.append(detailsButton);
        row.append(taskCell);

        const detailRow = document.createElement('tr');
        detailRow.className = 'record-detail-row';
        detailRow.hidden = true;
        const detailCell = document.createElement('td');
        detailCell.colSpan = 8;
        detailCell.className = 'record-details';
        const objectives = document.createElement('div');
        objectives.className = 'record-objectives';
        const checks = (record.checks || '').split(',').map(value => value === 'true');
        objectiveNames.forEach((name, index) => {
            const passed = index === 3 ? Number(record.dsa) >= 2
                : index === 8 ? countWords(record.win) >= MIN_WIN_WORDS
                    : Boolean(checks[index]);
            const objective = document.createElement('div');
            objective.className = `record-objective${passed ? ' done' : ''}`;
            objective.textContent = `${passed ? 'Done' : 'Open'} / ${name}`;
            objectives.append(objective);
        });
        detailCell.append(objectives);
        detailRow.append(detailCell);
        detailsButton.addEventListener('click', () => {
            detailRow.hidden = !detailRow.hidden;
            detailsButton.setAttribute('aria-expanded', String(!detailRow.hidden));
            detailsButton.textContent = detailRow.hidden ? 'View' : 'Hide';
        });
        body.append(row, detailRow);
    });
}

function showMessage(message) {
    const body = document.getElementById('records-body');
    body.replaceChildren();
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 8;
    cell.className = 'admin-message';
    cell.textContent = message;
    row.append(cell);
    body.append(row);
}

function csvValue(value) {
    let text = String(value ?? '');
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
}

function exportCsv() {
    const rows = [
        ['Date', 'Completed', 'DSA', 'Money spent', 'Submitted', 'Win of the day'],
        ...getFilteredRecords().map(record => [
            record.date,
            `${completedCount(record)}/9`,
            Number(record.dsa) || 0,
            record.money || '',
            Number(record.submitted) === 1 ? 'Yes' : 'No',
            record.win || ''
        ])
    ];
    const csv = rows.map(row => row.map(csvValue).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'winter-arc-records.csv';
    link.click();
    URL.revokeObjectURL(url);
}

function getFilteredRecords() {
    const month = document.getElementById('month-filter').value;
    const search = document.getElementById('record-search').value.trim().toLowerCase();
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    const submission = document.getElementById('submission-filter').value;
    return allRecords.filter(record => {
        const isSubmitted = Number(record.submitted) === 1;
        const searchable = `${record.date || ''} ${record.money || ''} ${record.win || ''}`.toLowerCase();
        return (!month || String(record.date || '').startsWith(month))
            && (!search || searchable.includes(search))
            && (!dateFrom || record.date >= dateFrom)
            && (!dateTo || record.date <= dateTo)
            && (submission === 'all' || (submission === 'submitted' ? isSubmitted : !isSubmitted));
    });
}

function syncMonthToDateRange() {
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    if (!dateFrom && !dateTo) return;
    const fromMonth = dateFrom.slice(0, 7);
    const toMonth = dateTo.slice(0, 7);
    document.getElementById('month-filter').value = dateFrom && dateTo && fromMonth !== toMonth
        ? ''
        : fromMonth || toMonth;
}

document.getElementById('record-search').addEventListener('input', renderRecords);
document.getElementById('month-filter').addEventListener('change', () => {
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    updateMonthlySpend();
    renderBudgetPie();
    renderRecords();
});
const handleDateRangeChange = () => {
    syncMonthToDateRange();
    updateMonthlySpend();
    renderBudgetPie();
    renderRecords();
};
document.getElementById('date-from').addEventListener('change', handleDateRangeChange);
document.getElementById('date-to').addEventListener('change', handleDateRangeChange);
document.getElementById('submission-filter').addEventListener('change', renderRecords);
document.getElementById('refresh-records').addEventListener('click', () => {
    syncMonthToDateRange();
    updateMonthlySpend();
    loadRecords();
});
document.getElementById('export-records').addEventListener('click', exportCsv);
document.getElementById('admin-login-form').addEventListener('submit', event => {
    event.preventDefault();
    const message = document.getElementById('login-message');
    const password = document.getElementById('admin-password').value;
    if (password !== ADMIN_PASSWORD) {
        message.textContent = 'Incorrect password';
        return;
    }
    document.getElementById('admin-password').value = '';
    message.textContent = '';
    document.getElementById('admin-login').hidden = true;
    document.getElementById('admin-app').hidden = false;
    loadRecords();
});
document.getElementById('admin-logout').addEventListener('click', () => {
    allRecords = [];
    document.getElementById('admin-app').hidden = true;
    document.getElementById('admin-login').hidden = false;
    document.getElementById('login-message').textContent = '';
});
const currentDate = new Date();
document.getElementById('month-filter').value = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
checkAuthentication();

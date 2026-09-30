const ADMIN_PASSWORD = 'admin123';
const STORAGE_PREFIX = 'winter-arc-progress-';
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
    const winPassed = (record.win || '').trim().length > 0;
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
    const total = allRecords.reduce((sum, record) => {
        const date = String(record.date || '');
        if (month && !date.startsWith(month)) return sum;
        if (!month && dateFrom && date < dateFrom) return sum;
        if (!month && dateTo && date > dateTo) return sum;
        return sum + (parseMoneyAmount(record.money) ?? 0);
    }, 0);
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
                : index === 8 ? (record.win || '').trim().length > 0
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
    renderRecords();
});
const handleDateRangeChange = () => {
    syncMonthToDateRange();
    updateMonthlySpend();
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

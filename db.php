<?php
// Initialize SQLite database
$dbFile = __DIR__ . '/winter_arc.db';
try {
    $pdo = new PDO('sqlite:' . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create table if it doesn't exist
    $pdo->exec("CREATE TABLE IF NOT EXISTS daily_logs (
        date TEXT PRIMARY KEY,
        checks TEXT,
        dsa INTEGER,
        money TEXT,
        win TEXT,
        deep_work_seconds INTEGER NOT NULL DEFAULT 0,
        submitted INTEGER DEFAULT 0,
        snapshot_checks TEXT,
        snapshot_dsa INTEGER,
        snapshot_money TEXT,
        snapshot_win TEXT,
        snapshot_deep_work_seconds INTEGER NOT NULL DEFAULT 0,
        snapshot_submitted INTEGER NOT NULL DEFAULT 0
    )");

    $columns = $pdo->query('PRAGMA table_info(daily_logs)')->fetchAll(PDO::FETCH_COLUMN, 1);
    $snapshotColumns = [
        'snapshot_checks' => 'TEXT',
        'snapshot_dsa' => 'INTEGER',
        'snapshot_money' => 'TEXT',
        'snapshot_win' => 'TEXT',
        'deep_work_seconds' => 'INTEGER NOT NULL DEFAULT 0',
        'snapshot_deep_work_seconds' => 'INTEGER NOT NULL DEFAULT 0',
        'snapshot_submitted' => 'INTEGER NOT NULL DEFAULT 0'
    ];
    foreach ($snapshotColumns as $column => $definition) {
        if (!in_array($column, $columns, true)) {
            $pdo->exec("ALTER TABLE daily_logs ADD COLUMN $column $definition");
        }
    }

    $pdo->exec("UPDATE daily_logs
        SET snapshot_checks = checks,
            snapshot_dsa = dsa,
            snapshot_money = money,
            snapshot_win = win,
            snapshot_submitted = 1
        WHERE submitted = 1 AND snapshot_submitted = 0");
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    die(json_encode(["error" => $e->getMessage()]));
}
?>
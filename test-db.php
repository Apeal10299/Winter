<?php
header('Content-Type: text/plain; charset=utf-8');

$pdo = null;

try {
    require __DIR__ . '/db.php';

    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        "INSERT INTO daily_logs (date, checks, dsa, money, win, submitted)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET checks = excluded.checks"
    );

    $stmt->execute([
        '2099-12-31',
        'false,false,false,false,false,false,false,false,false',
        0,
        '',
        '',
        0
    ]);

    $pdo->rollBack();

    echo "PASS: PHP connected to SQLite and completed a test write.\n";
    echo "Database file: " . __DIR__ . DIRECTORY_SEPARATOR . "winter_arc.db";
} catch (Throwable $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo "FAIL: " . $error->getMessage();
}
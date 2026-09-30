<?php
header('Content-Type: application/json');
header('Cache-Control: no-store');
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

function startAdminSession() {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    ini_set('session.use_strict_mode', '1');
    session_name('winter_arc_admin');
    session_set_cookie_params([
        'httponly' => true,
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'samesite' => 'Strict'
    ]);
    session_start();
}

function adminPasswordConfigured() {
    $hash = getenv('WARC_ADMIN_PASSWORD_HASH');
    $password = getenv('WARC_ADMIN_PASSWORD');
    return (is_string($hash) && $hash !== '') || (is_string($password) && $password !== '');
}

function verifyAdminPassword($providedPassword) {
    $hash = getenv('WARC_ADMIN_PASSWORD_HASH');
    if (is_string($hash) && $hash !== '') return password_verify($providedPassword, $hash);
    $configuredPassword = getenv('WARC_ADMIN_PASSWORD');
    return is_string($configuredPassword) && $configuredPassword !== ''
        && hash_equals($configuredPassword, $providedPassword);
}

// GET request: fetch specific date data or all logs for calendar view
if ($method === 'GET') {
    if (isset($_GET['auth'])) {
        startAdminSession();
        echo json_encode([
            'authenticated' => !empty($_SESSION['admin_authenticated']),
            'configured' => adminPasswordConfigured()
        ]);
        exit;
    } else if (isset($_GET['date'])) {
        $date = $_GET['date'];
        if ($date !== date('Y-m-d')) {
            startAdminSession();
            if (empty($_SESSION['admin_authenticated'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Admin login required']);
                exit;
            }
        }
        $stmt = $pdo->prepare("SELECT * FROM daily_logs WHERE date = ?");
        $stmt->execute([$date]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            echo json_encode(["checks" => "false,false,false,false,false,false,false,false,false", "dsa" => 0, "money" => "", "win" => "", "deep_work_seconds" => 0, "submitted" => 0, "found" => false]);
        } else {
            if (isset($_GET['details']) && (int)$row['snapshot_submitted'] === 1) {
                $row['checks'] = $row['snapshot_checks'];
                $row['dsa'] = $row['snapshot_dsa'];
                $row['money'] = $row['snapshot_money'];
                $row['win'] = $row['snapshot_win'];
                $row['deep_work_seconds'] = $row['snapshot_deep_work_seconds'];
            }
            $row['found'] = true;
            echo json_encode($row);
        }
    } else if (isset($_GET['all'])) {
        startAdminSession();
        if (empty($_SESSION['admin_authenticated'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Admin login required']);
            exit;
        }
        $stmt = $pdo->query("SELECT date,
            CASE WHEN snapshot_submitted = 1 THEN snapshot_checks ELSE checks END AS checks,
            CASE WHEN snapshot_submitted = 1 THEN snapshot_dsa ELSE dsa END AS dsa,
            CASE WHEN snapshot_submitted = 1 THEN snapshot_money ELSE money END AS money,
            CASE WHEN snapshot_submitted = 1 THEN snapshot_win ELSE win END AS win,
            CASE WHEN snapshot_submitted = 1 THEN snapshot_deep_work_seconds ELSE deep_work_seconds END AS deep_work_seconds,
            snapshot_submitted AS submitted
            FROM daily_logs
            ORDER BY date DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } else if (isset($_GET['history'])) {
        $stmt = $pdo->query("SELECT date, checks, dsa, win, snapshot_checks, snapshot_dsa, snapshot_win, snapshot_submitted FROM daily_logs");
        $history = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $useSnapshot = (int)$row['snapshot_submitted'] === 1;
            $checks = explode(',', $useSnapshot ? ($row['snapshot_checks'] ?? '') : ($row['checks'] ?? ''));
            $dsa = $useSnapshot ? ($row['snapshot_dsa'] ?? 0) : ($row['dsa'] ?? 0);
            $win = $useSnapshot ? ($row['snapshot_win'] ?? '') : ($row['win'] ?? '');
            $completed = count(array_filter($checks, static fn($value) => $value === 'true'));
            if ((int)$dsa >= 2 && ($checks[3] ?? 'false') !== 'true') $completed++;
            if (trim($win) !== '' && ($checks[8] ?? 'false') !== 'true') $completed++;
            $history[] = ["date" => $row['date'], "completed" => $completed];
        }
        echo json_encode($history);
    }
}

// POST request: Save or Submit data to cloud
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    if (($data['action'] ?? '') === 'login') {
        startAdminSession();
        if (!adminPasswordConfigured()) {
            http_response_code(503);
            echo json_encode(['success' => false, 'error' => 'Admin password is not configured on the server']);
            exit;
        }
        if (!isset($data['password']) || !is_string($data['password']) || !verifyAdminPassword($data['password'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Incorrect password']);
            exit;
        }
        session_regenerate_id(true);
        $_SESSION['admin_authenticated'] = true;
        echo json_encode(['success' => true]);
        exit;
    }

    if (($data['action'] ?? '') === 'logout') {
        startAdminSession();
        $_SESSION = [];
        session_destroy();
        echo json_encode(['success' => true]);
        exit;
    }
    
    if (!isset($data['date'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Date missing"]);
        exit;
    }

    $date = $data['date'];
    $checks = $data['checks'] ?? '';
    $dsa = $data['dsa'] ?? 0;
    $money = $data['money'] ?? '';
    $win = $data['win'] ?? '';
    $deepWorkSeconds = max(0, (int)($data['deep_work_seconds'] ?? 0));
    $submitted = !empty($data['submitted']) ? 1 : 0;

    $stmt = $pdo->prepare("INSERT INTO daily_logs
        (date, checks, dsa, money, win, deep_work_seconds, submitted, snapshot_checks, snapshot_dsa, snapshot_money, snapshot_win, snapshot_submitted, snapshot_deep_work_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET 
        checks = excluded.checks,
        dsa = excluded.dsa,
        money = excluded.money,
        win = excluded.win,
        deep_work_seconds = excluded.deep_work_seconds,
        submitted = excluded.submitted,
        snapshot_checks = CASE WHEN excluded.snapshot_submitted = 1 THEN excluded.snapshot_checks ELSE daily_logs.snapshot_checks END,
        snapshot_dsa = CASE WHEN excluded.snapshot_submitted = 1 THEN excluded.snapshot_dsa ELSE daily_logs.snapshot_dsa END,
        snapshot_money = CASE WHEN excluded.snapshot_submitted = 1 THEN excluded.snapshot_money ELSE daily_logs.snapshot_money END,
        snapshot_win = CASE WHEN excluded.snapshot_submitted = 1 THEN excluded.snapshot_win ELSE daily_logs.snapshot_win END,
        snapshot_submitted = CASE WHEN excluded.snapshot_submitted = 1 THEN 1 ELSE daily_logs.snapshot_submitted END,
        snapshot_deep_work_seconds = CASE WHEN excluded.snapshot_submitted = 1 THEN excluded.snapshot_deep_work_seconds ELSE daily_logs.snapshot_deep_work_seconds END");

    $success = $stmt->execute([
        $date, $checks, $dsa, $money, $win, $deepWorkSeconds, $submitted,
        $submitted ? $checks : null,
        $submitted ? $dsa : null,
        $submitted ? $money : null,
        $submitted ? $win : null,
        $submitted,
        $submitted ? $deepWorkSeconds : 0
    ]);

    echo json_encode(["success" => $success]);
}
?>
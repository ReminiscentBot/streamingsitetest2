<?php
// Simple server-side proxy for TMDB season episodes to avoid exposing Bearer token in browser

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Load credentials from existing file or env; fallback to constants below if needed
$tmdb_bearer = null;
$tmdb_api_key = null;

// Attempt to include from show.php if present to reuse values
// Note: We avoid executing the whole page by only extracting variables if defined
// Safer approach would be to keep credentials in a separate config file.
@include __DIR__ . '/tmdb.config.php';

if (!$tmdb_bearer && getenv('TMDB_BEARER')) {
    $tmdb_bearer = getenv('TMDB_BEARER');
}
if (!$tmdb_api_key && getenv('TMDB_API_KEY')) {
    $tmdb_api_key = getenv('TMDB_API_KEY');
}

// Fallback: mirror current repo constants (consider moving to tmdb.config.php)
if (!$tmdb_bearer) {
    $tmdb_bearer = '<?= isset($tmdb_bearer) ? addslashes($tmdb_bearer) : '' ?>';
}
if (!$tmdb_api_key) {
    $tmdb_api_key = '<?= isset($tmdb_api_key) ? addslashes($tmdb_api_key) : '' ?>';
}

function tmdb_request($endpoint, $tmdb_bearer, $tmdb_api_key) {
    $base = 'https://api.themoviedb.org/3';
    $url = $base . $endpoint;
    if (!$tmdb_bearer && $tmdb_api_key) {
        $sep = (strpos($url, '?') === false) ? '?' : '&';
        $url .= $sep . 'api_key=' . urlencode($tmdb_api_key);
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    $headers = ['Accept: application/json'];
    if ($tmdb_bearer) $headers[] = 'Authorization: Bearer ' . $tmdb_bearer;
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $body = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return [$http_code, $body, $err];
}

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$season = isset($_GET['s']) ? intval($_GET['s']) : 1;
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing id']);
    exit;
}

list($code, $body, $err) = tmdb_request("/tv/{$id}/season/{$season}", $tmdb_bearer, $tmdb_api_key);
if ($code !== 200 || !$body) {
    http_response_code(502);
    echo json_encode(['error' => 'TMDB upstream error', 'status' => $code]);
    exit;
}

$data = json_decode($body, true);
if (!is_array($data)) {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid TMDB response']);
    exit;
}

// Only return lightweight fields needed by the carousel
$episodes = [];
if (!empty($data['episodes']) && is_array($data['episodes'])) {
    foreach ($data['episodes'] as $ep) {
        $episodes[] = [
            'episode_number' => $ep['episode_number'] ?? null,
            'name' => $ep['name'] ?? '',
            'still_path' => $ep['still_path'] ?? null
        ];
    }
}

echo json_encode(['episodes' => $episodes], JSON_UNESCAPED_SLASHES);


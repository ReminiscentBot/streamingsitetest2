<?php
// ---------------- CONFIG ----------------
$tmdb_api_key = '0e584c58a4fcb552f6888700209533b7'; // replace with your TMDB v3 API key
// -----------------------------------------

// Example list of shows/movies
$shows = [
    ['title' => 'Titanic'],
    ['title' => 'Game of Thrones'],
    ['title' => 'Gotham'],
    ['title' => 'Breaking Bad'],
    ['title' => 'Lenox Hill'],
    ['title' => 'Dexter'], 
    ['title' => 'Dexter: New Blood'], 
    ['title' => 'Dexter: Resurrection'],
    ['title' => 'Dexter: Original Sin'], 
    
];

// Function to search TMDB for a title and get the first matching ID and type
function search_tmdb($title, $api_key) {
    $url = "https://api.themoviedb.org/3/search/multi?api_key={$api_key}&query=" . urlencode($title);
    $res = file_get_contents($url);
    $data = json_decode($res, true);

    if (!empty($data['results'])) {
        foreach ($data['results'] as $item) {
            $item_title = $item['media_type'] === 'movie' ? $item['title'] : $item['name'];
            if (strcasecmp($item_title, $title) === 0) {
                return [
                    'id' => $item['id'],
                    'type' => $item['media_type']
                ];
            }
        }
        // fallback: pick first result if no exact match
        $first = $data['results'][0];
        return [
            'id' => $first['id'],
            'type' => $first['media_type']
        ];
    }

    return null;
}

// Function to get TMDB poster URL
function get_tmdb_poster($tmdb_id, $type, $api_key) {
    $url = "https://api.themoviedb.org/3/{$type}/{$tmdb_id}?api_key={$api_key}";
    $res = file_get_contents($url);
    $data = json_decode($res, true);

    if (!empty($data['poster_path'])) {
        return "https://image.tmdb.org/t/p/w300" . $data['poster_path'];
    }
    return "https://via.placeholder.com/300x169?text=No+Image";
}

// Build full show list with IDs, types, and posters
$show_list = [];
foreach ($shows as $s) {
    $title = $s['title'];
    $search = search_tmdb($title, $tmdb_api_key);
    if ($search) {
        $poster = get_tmdb_poster($search['id'], $search['type'], $tmdb_api_key);
        $show_list[] = [
            'title' => $title,
            'tmdb_id' => $search['id'],
            'type' => $search['type'],
            'poster' => $poster
        ];
    } else {
        // fallback
        $show_list[] = [
            'title' => $title,
            'tmdb_id' => 0,
            'type' => 'unknown',
            'poster' => 'https://via.placeholder.com/300x169?text=No+Image'
        ];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reminiscent Streaming</title>
    <link rel="stylesheet" href="style.css">
    <style>
        body{background:#000;color:#fff;font-family:Arial,Helvetica,sans-serif;margin:0}
        header{background:#111;padding:12px 18px;border-bottom:1px solid #222}
        nav a{color:#0af;text-decoration:none;margin-right:12px}
        main{padding:18px}
        .show-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px; }
        .show-card { text-align:center; cursor:pointer; }
        .show-card img { width:150px; height:225px; border-radius:6px; display:block; margin:0 auto 6px; object-fit:cover; }
        .show-card span { display:block; font-size:14px; }
    </style>
</head>
<body>
<header>
    <h1>Reminiscent Streaming</h1>
    <nav><a href="index.php">Home</a></nav>
</header>
<main>
    <section>
        <h2>Popular Titles</h2>
        <div class="show-grid">
            <?php foreach ($show_list as $show): ?>
                <div class="show-card" onclick="location.href='show.php?id=<?= $show['tmdb_id'] ?>&force=<?= $show['type'] ?>'">
                    <img src="<?= $show['poster'] ?>" alt="<?= htmlspecialchars($show['title']) ?>">
                    <span><?= htmlspecialchars($show['title']) ?></span>
                </div>
            <?php endforeach; ?>
        </div>
    </section>
</main>
</body>
</html>

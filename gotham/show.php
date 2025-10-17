<?php
// --------- CONFIGURE THIS ---------
$tmdb_bearer = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwZTU4NGM1OGE0ZmNiNTUyZjY4ODg3MDAyMDk1MzNiNyIsIm5iZiI6MTc2MDY3MTg4MC4zOTUsInN1YiI6IjY4ZjFiODg4ZGJmMzhiZTAxMDU5MTAyNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.YlemV-RzEOHT6q5pcSNv_Oc4qVIeIp_KTnPfJaWVY9E'; // Bearer token
$tmdb_api_key = '0e584c58a4fcb552f6888700209533b7'; // API key
// -----------------------------------

function tmdb_request($endpoint, $tmdb_bearer, $tmdb_api_key) {
    $base = "https://api.themoviedb.org/3";
    $url = $base . $endpoint;
    if (!$tmdb_bearer && $tmdb_api_key) {
        $sep = (strpos($url, '?') === false) ? '?' : '&';
        $url .= $sep . 'api_key=' . urlencode($tmdb_api_key);
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_FAILONERROR, false);

    $headers = ['Accept: application/json'];
    if ($tmdb_bearer) $headers[] = 'Authorization: Bearer ' . $tmdb_bearer;

    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $body = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    return ['code' => $http_code, 'body' => $body, 'error' => $err];
}

// Input
$tmdb_id = isset($_GET['id']) ? intval($_GET['id']) : null;
$selected_season = isset($_GET['s']) ? intval($_GET['s']) : 1;
$selected_episode = isset($_GET['e']) ? intval($_GET['e']) : 1;
$force = isset($_GET['force']) ? strtolower(trim($_GET['force'])) : ''; // 'tv' or 'movie'

$title = "Streaming";
$type = null; // 'movie' or 'tv'
$seasons = [];
$episodes_in_season = [];
$movie = null;
$tv = null;

if ($tmdb_id) {
    $movie_resp = tmdb_request("/movie/{$tmdb_id}", $tmdb_bearer, $tmdb_api_key);
    $tv_resp    = tmdb_request("/tv/{$tmdb_id}", $tmdb_bearer, $tmdb_api_key);

    $movie_ok = ($movie_resp['code'] === 200 && $movie_resp['body']);
    $tv_ok    = ($tv_resp['code'] === 200 && $tv_resp['body']);

    if ($movie_ok) $movie = json_decode($movie_resp['body'], true);
    if ($tv_ok)    $tv    = json_decode($tv_resp['body'], true);

    if ($force === 'tv' && $tv_ok) {
        $type = 'tv';
    } elseif ($force === 'movie' && $movie_ok) {
        $type = 'movie';
    } else {
        if ($tv_ok && !$movie_ok) $type = 'tv';
        elseif ($movie_ok && !$tv_ok) $type = 'movie';
        elseif ($movie_ok && $tv_ok) {
            $tv_has_seasons = !empty($tv['seasons']) && is_array($tv['seasons']);
            $type = $tv_has_seasons ? 'tv' : 'movie';
        }
    }

    if ($type === 'movie' && $movie) $title = $movie['title'] ?? "Movie #{$tmdb_id}";
    elseif ($type === 'tv' && $tv) $title = $tv['name'] ?? "TV #{$tmdb_id}";
    elseif ($movie) $title = $movie['title'] ?? $title;
    elseif ($tv) $title = $tv['name'] ?? $title;

    if ($type === 'tv' && $tv) {
        if (!empty($tv['seasons']) && is_array($tv['seasons'])) {
            foreach ($tv['seasons'] as $s) {
                $season_num = isset($s['season_number']) ? intval($s['season_number']) : null;
                if ($season_num !== null) $seasons[$season_num] = $s['name'] ?? "Season {$season_num}";
            }
            ksort($seasons);
        }
        if (empty($seasons) && isset($tv['number_of_seasons'])) {
            for ($i=1;$i<=$tv['number_of_seasons'];$i++) $seasons[$i]="Season {$i}";
        }
        if ($selected_season <=0 || !isset($seasons[$selected_season])) {
            reset($seasons);
            $selected_season = key($seasons) ?: 1;
        }
        $season_resp = tmdb_request("/tv/{$tmdb_id}/season/{$selected_season}", $tmdb_bearer, $tmdb_api_key);
        if ($season_resp['code'] === 200 && $season_resp['body']) {
            $season_data = json_decode($season_resp['body'], true);
            if (!empty($season_data['episodes']) && is_array($season_data['episodes'])) {
                foreach ($season_data['episodes'] as $ep) {
                    $ep_num = isset($ep['episode_number']) ? intval($ep['episode_number']) : null;
                    if ($ep_num !== null) $episodes_in_season[$ep_num] = $ep['name'] ?? "Episode {$ep_num}";
                }
                ksort($episodes_in_season);
            }
        }
        if (empty($episodes_in_season)) {
            for ($i=1;$i<=25;$i++) $episodes_in_season[$i] = "Episode {$i}";
        }
    }
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title><?= htmlspecialchars($title) ?></title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="style.css" />
  <style>
    body{background:#000;color:#fff;font-family:Arial,Helvetica,sans-serif;margin:0}
    header{background:#111;padding:12px 18px;border-bottom:1px solid #222}
    main{padding:18px}
    nav a{color:#0af;text-decoration:none}
    iframe{display:block;border:0;width:100%;height:520px;margin-top:10px}
    form.selector { margin-bottom: 10px; display:flex; gap:8px; align-items:center; flex-wrap:wrap }
    select, button, input[type="text"] { padding:6px 10px; border-radius:6px; border:1px solid #444; background:#111; color:#fff }
    button { background:#0af; border:0; cursor:pointer }
    .error { color: #f66; margin-bottom: 10px }
    .picker { margin-bottom:10px; }
    .ambiguous { margin-bottom:10px; color:#ffd; }
    /* Highlight currently playing episode */
    .episode-item.active {
      border: 3px solid #0af;
      border-radius: 6px;
      transform: scale(1.05);
      transition: transform 0.2s;
    }

    /* Custom scrollbar */
    #episodeCarousel {
      display: flex;
      height: 300px;
      overflow-x: auto;
      overflow-y: hidden;
      scroll-behavior: smooth;
      gap: 10px;
      padding: 0 50px;
      align-items: center; /* vertically center cards */
    }

    #episodeCarousel img {
      display: block;
      max-height: 150px; /* adjust as needed */
    }

    #episodeCarousel::-webkit-scrollbar {
      height: 10px;
    }
    #episodeCarousel::-webkit-scrollbar-track {
      background: #111;
      border-radius: 5px;
    }
    #episodeCarousel::-webkit-scrollbar-thumb {
      background: #0af;
      border-radius: 5px;
    }
    #episodeCarousel::-webkit-scrollbar-thumb:hover {
      background: #08c;
}
  </style>
</head>
<body>
  <header>
    <h1><?= htmlspecialchars($title) ?></h1>
    <nav><a href="index.php">Home</a></nav>
  </header>
  <main>
    <?php if (!$tmdb_id): ?>
      <p>No TMDB ID provided. Return <a href="index.php">home</a>.</p>
    <?php else: ?>
      <?php if ($movie || $tv): ?>
        <?php if ($movie && $tv && !$force): ?>
          <div class="ambiguous">
            Both a <strong>movie</strong> and a <strong>TV show</strong> exist for this ID.
            (Automatic logic picked <strong><?= htmlspecialchars($type ?? 'unknown') ?></strong>.)
            You can force the type: 
            <a href="show.php?id=<?= $tmdb_id ?>&force=tv">Force TV</a> |
            <a href="show.php?id=<?= $tmdb_id ?>&force=movie">Force Movie</a>
          </div>
        <?php endif; ?>

        <?php if ($type === 'movie' && $movie): ?>
          <div class="info">Detected as <strong>movie</strong>.</div>
          <iframe src="https://vidsrc.wtf/api/4/movie/?id=<?= $tmdb_id ?>" allowfullscreen></iframe>

        <?php elseif ($type === 'tv' && $tv): ?>
        <div class="info">Detected as <strong>TV show</strong>.</div>
            

        <iframe id="tvPlayer" 
        src="https://vidsrc.wtf/api/4/tv/?id=<?= $tmdb_id ?>&s=<?= $selected_season ?>&e=<?= $selected_episode ?>" 
        allowfullscreen
        style="width:100%;height:520px;margin-top:15px;"></iframe>

        <form class="selector" method="get" action="show.php" id="tvForm">
          <input type="hidden" name="id" value="<?= $tmdb_id ?>">
          <input type="hidden" name="force" value="tv">
                
          <label for="season">Season</label>
          <select name="s" id="season">
            <?php foreach ($seasons as $num => $label): ?>
              <option value="<?= $num ?>" <?= ($num === $selected_season) ? 'selected' : '' ?>>
                <?= htmlspecialchars($label) ?> (<?= $num ?>)
              </option>
            <?php endforeach; ?>
          </select>
        </form>

        <div class="carousel-container" style="position:relative; margin-top:15px;">
          <button id="leftBtn" style="position:absolute; left:0; top:50%; transform:translateY(-50%); z-index:10; background:#0af; border:none; padding:10px; cursor:pointer;">&#10094;</button>
          <div id="episodeCarousel" 
               style="display:flex; overflow-x:auto; scroll-behavior:smooth; gap:10px; padding:0 50px;">
          </div>
          <button id="rightBtn" style="position:absolute; right:0; top:50%; transform:translateY(-50%); z-index:10; background:#0af; border:none; padding:10px; cursor:pointer;">&#10095;</button>
        </div>

        <?php else: ?>
          <div class="error">TMDB returned invalid data for ID <?= htmlspecialchars($tmdb_id) ?>.</div>
        <?php endif; ?>

      <?php else: ?>
        <div class="error">TMDB did not return a movie or TV show for ID <?= htmlspecialchars($tmdb_id) ?>.</div>
      <?php endif; ?>

      <script>
        // Watch progress listener per Vidsrc docs
        window.addEventListener('message', (event) => {
          if (event.origin !== 'https://www.vidsrc.wtf') return;
          if (event.data && event.data.type === 'MEDIA_DATA') {
            try {
              const mediaData = event.data.data;
              localStorage.setItem('vidsrcwtf-Progress', JSON.stringify(mediaData));
            } catch (_) {
              // ignore storage errors
            }
          }
        });

        const player = document.getElementById('tvPlayer');
        const seasonSelect = document.getElementById('season');
        const carousel = document.getElementById('episodeCarousel');
        let episodesData = [];
        let currentEpisode = <?= $selected_episode ?>;
            
        function highlightCurrentEpisode() {
          const items = carousel.querySelectorAll('.episode-item');
          items.forEach(item => {
            if (parseInt(item.dataset.ep) === currentEpisode) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          });
        }
        
        async function loadEpisodes(season) {
          carousel.innerHTML = 'Loading episodes...';

          try {
            const res = await fetch(`episodes.php?id=<?= $tmdb_id ?>&s=${season}`);
            if (!res.ok) throw new Error('Failed to load episodes');
            const data = await res.json();
            episodesData = Array.isArray(data.episodes) ? data.episodes : [];
          } catch (e) {
            carousel.innerHTML = 'Failed to load episodes.';
            episodesData = [];
          }
      
          carousel.innerHTML = '';
          episodesData.forEach(ep => {
            const epDiv = document.createElement('div');
            epDiv.classList.add('episode-item');
            epDiv.dataset.ep = ep.episode_number;
            epDiv.style.minWidth = '150px';
            epDiv.style.cursor = 'pointer';
            epDiv.style.textAlign = 'center';
            epDiv.style.flexShrink = '0';
        
            const thumb = document.createElement('img');
            thumb.src = ep.still_path 
              ? `https://image.tmdb.org/t/p/w300${ep.still_path}` 
              : 'https://via.placeholder.com/300x169?text=No+Image';
            thumb.style.width = '100%';
            thumb.style.borderRadius = '6px';
        
            const title = document.createElement('div');
            title.textContent = `Ep ${ep.episode_number}: ${ep.name}`;
            title.style.fontSize = '14px';
            title.style.marginTop = '4px';
        
            epDiv.appendChild(thumb);
            epDiv.appendChild(title);
        
            epDiv.addEventListener('click', () => {
              currentEpisode = ep.episode_number;
              player.src = `https://vidsrc.wtf/api/4/tv/?id=<?= $tmdb_id ?>&s=${season}&e=${ep.episode_number}`;
              highlightCurrentEpisode();
            });
        
            carousel.appendChild(epDiv);
          });
      
          highlightCurrentEpisode();
        }
        
        // Initial load
        loadEpisodes(<?= $selected_season ?>);
        
        // Change season
        seasonSelect.addEventListener('change', () => {
          currentEpisode = 1; // reset to first episode of new season
          loadEpisodes(seasonSelect.value);
        });
        
        // Arrow buttons
        document.getElementById('leftBtn').addEventListener('click', () => {
          carousel.scrollBy({ left: -300, behavior: 'smooth' });
        });
        document.getElementById('rightBtn').addEventListener('click', () => {
          carousel.scrollBy({ left: 300, behavior: 'smooth' });
        });

        // Mouse wheel horizontal scroll
        carousel.addEventListener('wheel', (e) => {
          e.preventDefault();
        
          // Adjust speed factor
          const speed = 2; // increase if scrolling feels slow
          carousel.scrollLeft += e.deltaY * speed;
        });
      </script>

    <?php endif; ?>
  </main>
</body>
</html>

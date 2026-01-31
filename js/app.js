const TMDB_API_KEY = '265c483f5cbbe6dc4c80870342f7a373';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyNjVjNDgzZjVjYmJlNmRjNGM4MDg3MDM0MmY3YTM3MyIsIm5iZiI6MTc2OTg3NDU2OC4yOCwic3ViIjoiNjk3ZTI0ODgzZTNhYzVmMzc5M2U0ZWYzIiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.wzBZSIATSeAgeKHS-AwTMP-Mz0qG9sOuF4rft-NeRos';
const RAPID_API_KEY = 'c96aa6a97bmsh58d05ea107e5ab3p1ff108jsn6ba062afac30';
const DOWNLOAD_API_HOST = 'movie-download.p.rapidapi.com';
const VIDEO_FETCHER_HOST = 'movie-tv-show-video-fetcher.p.rapidapi.com';
const MIRROR_API_HOST = 'movies-download-links-api.p.rapidapi.com';
const GOGOANIME_API_HOST = 'gogoanime2.p.rapidapi.com';
const ANIME_DB_HOST = 'anime-db.p.rapidapi.com';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';

async function fetchMovies(endpoint, params = "") {
    try {
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`
            }
        };
        const res = await fetch(`${BASE_URL}${endpoint}?${params}`, options);
        const data = await res.json();
        return data;
    } catch (err) {
        console.error("Fetch error:", err);
        return { results: [], total_pages: 0 };
    }
}

async function fetchVideoLink(id, type = 'movie') {
    try {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Rapidapi-Key': RAPID_API_KEY,
                'X-Rapidapi-Host': VIDEO_FETCHER_HOST
            },
            body: JSON.stringify({
                type: type,
                tmdb_id: String(id),
                season_number: "1",
                episode_number: "1"
            })
        };
        const res = await fetch(`https://${VIDEO_FETCHER_HOST}/api.php`, options);
        const data = await res.json();
        return data.url || null;
    } catch (err) {
        console.error("Video Fetcher failed");
        return null;
    }
}

async function fetchMirrorLinks(movieData, type = 'movie') {
    try {
        const year = (movieData.release_date || movieData.first_air_date || "2024").split('-')[0];
        const genre = movieData.genres && movieData.genres.length > 0 ? movieData.genres[0].name.toLowerCase() : "action";

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Rapidapi-Key': RAPID_API_KEY,
                'X-Rapidapi-Host': MIRROR_API_HOST
            },
            body: JSON.stringify({
                start: 0,
                limit: 5,
                genre: genre,
                tag: type === 'tv' ? 'TV Show' : 'Movie',
                year: parseInt(year)
            })
        };
        const res = await fetch(`https://${MIRROR_API_HOST}/filters`, options);
        const data = await res.json();
        // Returning the first relevant result if available
        return data && data.length > 0 ? data[0].link : null;
    } catch (err) {
        console.error("Mirror API Fetch failed");
        return null;
    }
}

async function renderSlideshow() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const data = await fetchMovies('/movie/now_playing');
    const featured = data.results.slice(0, 5);
    let currentIndex = 0;

    function updateHero(index) {
        const movie = featured[index];
        hero.innerHTML = `
            <img src="https://image.tmdb.org/t/p/original${movie.backdrop_path}" alt="${movie.title}" class="hero-bg" style="opacity: 0; transition: opacity 1s ease-in-out;">
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <div class="card-badge" style="position: static; width: fit-content; margin-bottom: 1rem; background: var(--accent-color); color: #000; padding: 4px 12px; border-radius: 4px; font-weight: 800;">TMDB TRENDING</div>
                <h1>${movie.title}</h1>
                <div class="hero-meta">
                    <span>${movie.release_date.split('-')[0]}</span>
                    <span>|</span>
                    <span>${movie.vote_average} ⭐</span>
                </div>
                <p class="hero-info">${movie.overview}</p>
                <div class="hero-btns">
                    <button class="btn btn-primary" onclick="openModal(${movie.id}, 'movie')"><i class="fas fa-play"></i> Watch Now</button>
                    <button class="btn btn-secondary"><i class="fas fa-plus"></i> Watchlist</button>
                </div>
            </div>
            <div class="slideshow-dots" style="position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 10; display: flex; gap: 10px;">
                ${featured.map((_, i) => `<div class="dot ${i === index ? 'active' : ''}" style="width: 12px; height: 12px; border-radius: 50%; background: ${i === index ? 'var(--accent-color)' : 'rgba(255,255,255,0.3)'}; cursor: pointer;" onclick="event.stopPropagation(); changeSlide(${i})"></div>`).join('')}
            </div>
        `;
        setTimeout(() => { if (hero.querySelector('.hero-bg')) hero.querySelector('.hero-bg').style.opacity = '1'; }, 50);
    }

    window.changeSlide = (index) => {
        currentIndex = index;
        updateHero(currentIndex);
    };

    updateHero(currentIndex);
    setInterval(() => {
        currentIndex = (currentIndex + 1) % featured.length;
        updateHero(currentIndex);
    }, 8000);
}

function createMovieCard(movie, type = 'movie') {
    const title = movie.title || movie.name || "Untitled";
    const year = (movie.release_date || movie.first_air_date || "").split('-')[0] || "N/A";
    const poster = movie.poster_path ? `${IMG_PATH}${movie.poster_path}` : "https://via.placeholder.com/500x750?text=No+Image";

    return `
        <div class="movie-card" onclick="openModal(${movie.id}, '${type}')">
            <div class="card-img">
                <img src="${poster}" alt="${title}" loading="lazy">
                <div class="card-badge">${(movie.vote_average || 0).toFixed(1)}</div>
            </div>
            <h3>${title}</h3>
            <p>${year}</p>
        </div>
    `;
}

async function renderSliders() {
    const main = document.querySelector('main');
    if (!main) return;
    main.innerHTML = '';
    const categoriesList = [
        { name: "Trending Now", endpoint: "/trending/movie/week" },
        { name: "Popular on PlayMe", endpoint: "/movie/popular" },
        { name: "Recommended TV", endpoint: "/tv/top_rated", type: 'tv' },
        { name: "Sci-Fi Hits", endpoint: "/discover/movie", params: "with_genres=878" }
    ];

    for (const cat of categoriesList) {
        const data = await fetchMovies(cat.endpoint, cat.params || "");
        const movies = data.results || [];
        const section = document.createElement('section');
        section.className = 'section';
        section.innerHTML = `
            <div class="section-header">
                <h2>${cat.name}</h2>
                <a href="${cat.type === 'tv' ? 'tv-shows.html' : 'movies.html'}" style="color: var(--accent-color); text-decoration: none; font-size: 0.9rem;">View All</a>
            </div>
            <div class="slider-container">
                <div class="slider">
                    ${movies.map(movie => createMovieCard(movie, cat.type || 'movie')).join('')}
                </div>
            </div>
        `;
        main.appendChild(section);
    }
}

async function openModal(id, type = 'movie') {
    const modal = document.getElementById('movieModal');
    const content = document.getElementById('modalDetails');
    content.innerHTML = `<div style="padding: 2rem; color: var(--accent-color); text-align:center;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i><br>
        Optimizing Multi-Source Handshake...
    </div>`;
    modal.style.display = 'flex';

    try {
        const tmdbUrl = `${BASE_URL}/${type}/${id}`;
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`
            }
        };
        const res = await fetch(tmdbUrl, options);
        const movieData = await res.json();

        const [videoUrl, { download_url }, mirrorUrl] = await Promise.all([
            fetchVideoLink(id, type),
            (async () => {
                const slug = (movieData.title || movieData.name).toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
                const year = (movieData.release_date || movieData.first_air_date || "").split('-')[0];
                const url = `https://${DOWNLOAD_API_HOST}/details?url=https%3A%2F%2Ffmovies24-to.com%2F${type}s%2F${slug}-${year}`;
                try {
                    const r = await fetch(url, { headers: { 'X-Rapidapi-Key': RAPID_API_KEY, 'X-Rapidapi-Host': DOWNLOAD_API_HOST } });
                    const d = await r.json();
                    return d;
                } catch (e) { return { download_url: null }; }
            })(),
            fetchMirrorLinks(movieData, type)
        ]);

        const streamLink = videoUrl || mirrorUrl || `https://ww1.goojara.to/index.php?s=${encodeURIComponent(movieData.title || movieData.name)}`;
        const downloadLink = download_url || "https://psa.wf/category/movie/";

        content.innerHTML = `
            <div class="modal-left">
                <img src="${IMG_PATH}${movieData.poster_path}" alt="${movieData.title || movieData.name}">
            </div>
            <div class="modal-right">
                <div class="card-badge" style="position: static; width: fit-content; margin-bottom: 1rem;">${movieData.vote_average.toFixed(1)} ⭐</div>
                <h2>${movieData.title || movieData.name}</h2>
                <p style="color: var(--text-secondary)">${movieData.genres ? movieData.genres.map(g => g.name).join(', ') : ''}</p>
                <div class="hero-meta">
                    <span style="color: ${videoUrl ? 'var(--accent-color)' : (mirrorUrl ? '#ff9800' : 'white')}">
                        Server: ${videoUrl ? 'Ultra HD' : (mirrorUrl ? 'Mirror Cloud' : 'Global Source')}
                    </span>
                </div>
                <p>${movieData.overview}</p>
                <div class="hero-btns" style="margin-top: auto;">
                    <a href="${streamLink}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-play"></i> Stream
                    </a>
                    <a href="${downloadLink}" target="_blank" class="btn btn-secondary">
                        <i class="fas fa-download"></i> Download
                    </a>
                </div>
            </div>
        `;
    } catch (e) {
        content.innerHTML = `<div style="padding: 2rem; color: red;">Failed to load data.</div>`;
    }
}

function openAnimeModal(title, anikaiLink, img, ep) {
    const modal = document.getElementById('movieModal');
    const content = document.getElementById('modalDetails');
    modal.style.display = 'flex';

    content.innerHTML = `
        <div class="modal-left">
            <img src="${img}" alt="${title}">
        </div>
        <div class="modal-right">
            <div class="card-badge" style="position: static; width: fit-content; margin-bottom: 1rem;">${ep} Episode(s)</div>
            <h2>${title}</h2>
            <p style="color: var(--text-secondary)">Mirrored from Anikai TV</p>
            <p>Select a server to start watching. Goojara is the primary high-speed source, while Anikai serves as the definitive mirror lookup.</p>
            <div class="hero-btns" style="margin-top: auto; display: flex; flex-direction: column; gap: 1rem;">
                <a href="https://ww1.goojara.to/index.php?s=${encodeURIComponent(title)}" target="_blank" class="btn btn-primary" style="width: 100%; justify-content: center;">
                    <i class="fas fa-search"></i> Look up on Goojara (Server 1)
                </a>
                <a href="${anikaiLink}" target="_blank" class="btn btn-secondary" style="width: 100%; justify-content: center;">
                    <i class="fas fa-link"></i> Look up on Anikai (Server 2)
                </a>
            </div>
        </div>
    `;
}

function closeModal() {
    document.getElementById('movieModal').style.display = 'none';
}

window.onclick = (e) => { if (e.target == document.getElementById('movieModal')) closeModal(); };

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const page = path.split("/").pop();

    if (page === 'index.html' || page === '') {
        renderSlideshow();
        renderSliders();
    } else if (page === 'anime.html') {
        renderAnimePage();
    } else if (page === 'tv-shows.html') {
        renderCategoryPage('TV Shows', '/tv/popular', 'tv');
    } else if (page === 'movies.html') {
        const urlParams = new URLSearchParams(window.location.search);
        const genre = urlParams.get('genre');
        if (genre) {
            renderCategoryPage('Genre Search', '/discover/movie', 'movie', `with_genres=${genre}`);
        } else {
            renderCategoryPage('Movies', '/movie/popular', 'movie');
        }
    }

    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(11, 15, 19, 0.95)';
            header.style.padding = '1rem 5%';
        } else {
            header.style.background = 'linear-gradient(to bottom, rgba(11, 15, 19, 0.8), transparent)';
            header.style.padding = '1.5rem 5%';
        }
    });

    const searchBtn = document.querySelector('.search-btn');
    searchBtn.addEventListener('click', () => {
        const query = prompt("Global Search:");
        if (!query) return;
        renderCategoryPage(`Results for "${query}"`, '/search/movie', 'movie', `query=${encodeURIComponent(query)}`);
    });

    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    menuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        menuToggle.innerHTML = nav.classList.contains('active') ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
});

async function renderCategoryPage(title, endpoint, type, params = "", page = 1) {
    const main = document.querySelector('main');
    main.innerHTML = `<div style="padding: 8rem 0; text-align: center;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--accent-color);"></i></div>`;

    const data1 = await fetchMovies(endpoint, `${params}&page=${page}`);
    const data2 = await fetchMovies(endpoint, `${params}&page=${page + 1}`);
    const movies = [...(data1.results || []), ...(data2.results || [])];
    const totalPages = Math.floor((data1.total_pages || 1) / 2);

    main.innerHTML = `
        <section class="section" style="padding-top: 10rem;">
            <div class="section-header">
                <h2>${title}</h2>
                <a href="index.html" class="btn btn-secondary">Back Home</a>
            </div>
            <div class="grid-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)); gap: 2rem;">
                ${movies.map(item => createMovieCard(item, type)).join('')}
            </div>
            ${renderPagination(page, totalPages, (p) => renderCategoryPage(title, endpoint, type, params, p))}
        </section>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPagination(currentPage, totalPages, onPageChange) {
    if (totalPages <= 1) return '';
    const funcName = 'changePage' + Math.random().toString(36).substr(2, 9);
    window[funcName] = onPageChange;
    let html = `<div class="pagination">`;
    html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${funcName}(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;

    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="${funcName}(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="${funcName}(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
    html += `</div>`;
    return html;
}

async function renderAnimePage() {
    const main = document.querySelector('main');
    main.innerHTML = `<div style="padding: 8rem 0; text-align: center;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--accent-color);"></i></div>`;

    try {
        const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://anikai.to/tv');
        const proxyRes = await fetch(proxyUrl);
        const proxyData = await proxyRes.json();
        const html = proxyData.contents;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const items = doc.querySelectorAll('.aitem');

        const anikaiContent = Array.from(items).map(item => {
            const titleEl = item.querySelector('.title');
            const title = titleEl ? titleEl.innerText : "Untitled Anime";
            const imgEl = item.querySelector('img');
            const imgSrcBase = imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('src')) : "";
            const imgSrc = imgSrcBase.startsWith('http') ? imgSrcBase : 'https://anikai.to' + imgSrcBase;
            const linkEl = item.querySelector('.poster');
            const linkBase = linkEl ? linkEl.getAttribute('href') : "#";
            const link = linkBase.startsWith('http') ? linkBase : 'https://anikai.to' + linkBase;
            const episode = item.querySelector('.sub') ? item.querySelector('.sub').innerText : "HOT";

            const safeTitle = title.replace(/'/g, "\\'");
            return `
                <div class="movie-card" onclick="openAnimeModal('${safeTitle}', '${link}', '${imgSrc}', '${episode}')">
                    <div class="card-img">
                        <img src="${imgSrc}" alt="${title}" onerror="this.src='https://via.placeholder.com/500x750?text=Anime'">
                        <div class="card-badge">${episode}</div>
                    </div>
                    <h3>${title}</h3>
                    <p>Source Overlay</p>
                </div>
            `;
        }).join('');

        const filterHTML = `
            <div class="filter-bar" style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem; padding: 1.5rem; background: var(--surface-color); border-radius: 12px; border: 1px solid var(--surface-border); backdrop-filter: var(--glass-blur);">
                <div class="filter-group"><select class="filter-select"><option>Type: All</option><option>Movie</option><option>TV Series</option></select></div>
                <div class="filter-group"><select class="filter-select"><option>Genre: All</option><option>Action</option><option>Comedy</option></select></div>
                <button class="btn btn-primary" style="margin-left: auto;" onclick="window.open('https://anikai.to/browser', '_blank')"><i class="fas fa-filter"></i> Advanced Filter</button>
            </div>
        `;

        main.innerHTML = `
            <section class="section" style="padding-top: 10rem;">
                <div class="section-header">
                    <h2>Anime Series</h2>
                    <a href="index.html" class="btn btn-secondary">Back Home</a>
                </div>
                ${filterHTML}
                <div class="grid-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)); gap: 2rem;">
                    ${anikaiContent}
                </div>
                <div class="pagination">
                    <button class="page-btn active">1</button>
                    <button class="page-btn" onclick="window.open('https://anikai.to/tv?page=2', '_blank')">2</button>
                    <button class="page-btn" onclick="window.open('https://anikai.to/tv?page=173', '_blank')">173</button>
                </div>
            </section>
        `;
    } catch (e) {
        renderCategoryPage('Anime', '/discover/tv', 'tv', 'with_genres=16');
    }
}

const catalog = [
  {
    id: "ignition",
    title: "Ignition",
    year: 1997,
    platform: "Windows",
    engine: "BoxedWine",
    status: "integrating",
    statusText: "EN INTEGRACIÓN",
    monogram: "IGN",
    colors: ["#101c42", "#742f77", "#ff3bd4"],
    description: "Carreras arcade isométricas. Estamos preparando su ejecución directa en Chrome."
  },
  {
    id: "freedoom",
    title: "Freedoom",
    year: 2003,
    platform: "DOS",
    engine: "WebAssembly",
    status: "soon",
    statusText: "PRÓXIMAMENTE",
    monogram: "FD",
    colors: ["#351014", "#89211e", "#ff7d35"],
    description: "Contenido libre compatible con motores Doom. Candidato ideal para una primera versión jugable."
  },
  {
    id: "browserquest",
    title: "BrowserQuest",
    year: 2012,
    platform: "Browser",
    engine: "HTML5",
    status: "soon",
    statusText: "PRÓXIMAMENTE",
    monogram: "BQ",
    colors: ["#0a2740", "#135f6b", "#2df7ff"],
    description: "RPG multijugador open-source diseñado para navegador."
  },
  {
    id: "opensurge",
    title: "Open Surge",
    year: 2008,
    platform: "Browser",
    engine: "WebAssembly",
    status: "soon",
    statusText: "PRÓXIMAMENTE",
    monogram: "OS",
    colors: ["#0b2152", "#315fe8", "#2df7ff"],
    description: "Plataformas open-source inspirado en la era de los 16 bits."
  }
];

const grid = document.querySelector("#catalogGrid");
const template = document.querySelector("#gameCardTemplate");
const searchInput = document.querySelector("#searchInput");
const filters = [...document.querySelectorAll(".filter")];
const emptyState = document.querySelector("#emptyState");
const favCount = document.querySelector("#favoritesCount");
const favoritesToggle = document.querySelector("#favoritesToggle");
const statGames = document.querySelector("#statGames");
const year = document.querySelector("#year");

let selectedPlatform = "all";
let favoritesOnly = false;
const favorites = new Set(JSON.parse(localStorage.getItem("jr-favorites") || "[]"));

function saveFavorites(){
  localStorage.setItem("jr-favorites", JSON.stringify([...favorites]));
  favCount.textContent = favorites.size;
}

function render(){
  const q = searchInput.value.trim().toLowerCase();

  const games = catalog.filter(game => {
    const platformOk = selectedPlatform === "all" || game.platform === selectedPlatform;
    const queryOk = !q || [game.title, game.platform, game.engine, String(game.year)].join(" ").toLowerCase().includes(q);
    const favoriteOk = !favoritesOnly || favorites.has(game.id);
    return platformOk && queryOk && favoriteOk;
  });

  grid.replaceChildren();
  emptyState.hidden = games.length > 0;

  games.forEach(game => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".game-card");
    const cover = node.querySelector(".game-cover");
    const favorite = node.querySelector(".favorite");
    const status = node.querySelector(".status-badge");

    cover.style.setProperty("--cover-a", game.colors[0]);
    cover.style.setProperty("--cover-b", game.colors[1]);
    cover.style.setProperty("--cover-glow", game.colors[2]);

    node.querySelector(".cover-monogram").textContent = game.monogram;
    node.querySelector(".platform-badge").textContent = game.platform;
    status.textContent = game.statusText;
    status.classList.add(game.status);

    node.querySelector("h3").textContent = game.title;
    node.querySelector(".game-meta").textContent = `${game.year} · ${game.engine}`;
    node.querySelector(".game-description").textContent = game.description;

    const isFavorite = favorites.has(game.id);
    favorite.classList.toggle("active", isFavorite);
    favorite.textContent = isFavorite ? "★" : "☆";
    favorite.addEventListener("click", () => {
      favorites.has(game.id) ? favorites.delete(game.id) : favorites.add(game.id);
      saveFavorites();
      render();
    });

    const play = node.querySelector(".play-button");
    const playable = game.status === "playable";
    play.disabled = !playable;
    play.textContent = playable ? "JUGAR" : game.status === "integrating" ? "EN INTEGRACIÓN" : "PRÓXIMAMENTE";

    node.querySelector(".details-button").addEventListener("click", () => {
      card.animate(
        [{transform:"translateY(-7px) scale(1)"},{transform:"translateY(-7px) scale(1.015)"},{transform:"translateY(-7px) scale(1)"}],
        {duration:320,easing:"ease-out"}
      );
    });

    grid.appendChild(node);
  });
}

filters.forEach(button => {
  button.addEventListener("click", () => {
    selectedPlatform = button.dataset.platform;
    filters.forEach(b => b.classList.toggle("active", b === button));
    render();
  });
});

searchInput.addEventListener("input", render);
favoritesToggle.addEventListener("click", () => {
  favoritesOnly = !favoritesOnly;
  favoritesToggle.style.borderColor = favoritesOnly ? "rgba(255,209,102,.45)" : "";
  render();
});

function startStarfield(){
  const canvas = document.querySelector("#starfield");
  const ctx = canvas.getContext("2d");
  let stars = [];

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    stars = Array.from({length: Math.min(170, Math.floor(innerWidth / 7))}, () => ({
      x: Math.random()*innerWidth,
      y: Math.random()*innerHeight,
      r: Math.random()*1.2+.25,
      a: Math.random()*.55+.1,
      s: Math.random()*.08+.015
    }));
  };

  const draw = () => {
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for(const star of stars){
      star.y += star.s;
      if(star.y > innerHeight){star.y=0;star.x=Math.random()*innerWidth}
      ctx.beginPath();
      ctx.fillStyle = `rgba(180,215,255,${star.a})`;
      ctx.arc(star.x,star.y,star.r,0,Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  };

  resize();
  addEventListener("resize", resize, {passive:true});
  draw();
}

statGames.textContent = catalog.length;
year.textContent = new Date().getFullYear();
saveFavorites();
render();
startStarfield();

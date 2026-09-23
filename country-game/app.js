const API_URL = "https://opentdb.com/api.php?amount=5&category=22&type=multiple";
const WORLD_GEOJSON_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
const STORAGE_KEY = "daily-geography-puzzle-v5";
const QUIZ_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAP_WIDTH = 960;
const MAP_HEIGHT = 500;

const MODES = [
  {
    id: "seterra",
    title: "Seterra style",
    description: "Locate countries by clicking highlighted regions on an interactive world map.",
  },
  {
    id: "geo",
    title: "Geo-Games style",
    description: "Type each country from clues, with optional hint support for tougher rounds.",
  },
  {
    id: "geogrid",
    title: "GeoGrid style",
    description: "Fill a 3x3 country grid where every answer must satisfy both its row clue and column clue.",
  },
];

const COUNTRY_ALIASES = {
  usa: ["unitedstatesofamerica", "unitedstates"],
  uk: ["unitedkingdom", "greatbritain"],
  czechrepublic: ["czechia"],
  drcongo: ["democraticrepublicofthecongo", "congo"],
  republicofthecongo: ["congo"],
  swaziland: ["eswatini"],
  burma: ["myanmar"],
  ivorycoast: ["cotedivoire"],
  russia: ["russianfederation"],
  southkorea: ["korea"],
  northkorea: ["democraticpeoplesrepublicofkorea"],
  syria: ["syrianarabrepublic"],
  laos: ["laopeoplesdemocraticrepublic"],
  iran: ["iranislamicrepublicof"],
  moldova: ["moldovarepublicof"],
  palestine: ["stateofpalestine"],
  venezuela: ["venezuelabolivarianrepublicof"],
  tanzania: ["tanzaniaunitedrepublicof"],
  bolivia: ["boliviaplurinationalstateof"],
  brunei: ["bruneidarussalam"],
  macedonia: ["northmacedonia", "theformeryugoslavrepublicofmacedonia"],
};

const COUNTRY_DATA = [
  { name: "France", continents: ["Europe"], landlocked: false, island: false, populationM: 68, languages: ["french"], hemispheres: ["north"] },
  { name: "Germany", continents: ["Europe"], landlocked: false, island: false, populationM: 84, languages: [], hemispheres: ["north"] },
  { name: "Italy", continents: ["Europe"], landlocked: false, island: false, populationM: 59, languages: [], hemispheres: ["north"] },
  { name: "Spain", continents: ["Europe"], landlocked: false, island: false, populationM: 48, languages: ["spanish"], hemispheres: ["north"] },
  { name: "Switzerland", continents: ["Europe"], landlocked: true, island: false, populationM: 9, languages: ["french"], hemispheres: ["north"] },
  { name: "Austria", continents: ["Europe"], landlocked: true, island: false, populationM: 9, languages: [], hemispheres: ["north"] },
  { name: "Hungary", continents: ["Europe"], landlocked: true, island: false, populationM: 10, languages: [], hemispheres: ["north"] },
  { name: "Ireland", continents: ["Europe"], landlocked: false, island: true, populationM: 5, languages: ["english"], hemispheres: ["north"] },
  { name: "Iceland", continents: ["Europe"], landlocked: false, island: true, populationM: 0.4, languages: [], hemispheres: ["north"] },
  { name: "United Kingdom", continents: ["Europe"], landlocked: false, island: true, populationM: 68, languages: ["english"], hemispheres: ["north"] },
  { name: "Malta", continents: ["Europe"], landlocked: false, island: true, populationM: 0.5, languages: ["english"], hemispheres: ["north"] },
  { name: "Nigeria", continents: ["Africa"], landlocked: false, island: false, populationM: 223, languages: ["english"], hemispheres: ["north"] },
  { name: "Egypt", continents: ["Africa"], landlocked: false, island: false, populationM: 111, languages: ["arabic"], hemispheres: ["north"] },
  { name: "Ethiopia", continents: ["Africa"], landlocked: true, island: false, populationM: 126, languages: [], hemispheres: ["north"] },
  { name: "South Africa", continents: ["Africa"], landlocked: false, island: false, populationM: 60, languages: ["english"], hemispheres: ["south"] },
  { name: "Madagascar", continents: ["Africa"], landlocked: false, island: true, populationM: 30, languages: ["french"], hemispheres: ["south"] },
  { name: "Morocco", continents: ["Africa"], landlocked: false, island: false, populationM: 38, languages: ["french", "arabic"], hemispheres: ["north"] },
  { name: "Algeria", continents: ["Africa"], landlocked: false, island: false, populationM: 45, languages: ["french", "arabic"], hemispheres: ["north"] },
  { name: "Mali", continents: ["Africa"], landlocked: true, island: false, populationM: 23, languages: ["french"], hemispheres: ["north"] },
  { name: "Niger", continents: ["Africa"], landlocked: true, island: false, populationM: 27, languages: ["french"], hemispheres: ["north"] },
  { name: "Cameroon", continents: ["Africa"], landlocked: false, island: false, populationM: 29, languages: ["english", "french"], hemispheres: ["north"] },
  { name: "Zambia", continents: ["Africa"], landlocked: true, island: false, populationM: 21, languages: ["english"], hemispheres: ["south"] },
  { name: "China", continents: ["Asia"], landlocked: false, island: false, populationM: 1410, languages: [], hemispheres: ["north"] },
  { name: "India", continents: ["Asia"], landlocked: false, island: false, populationM: 1430, languages: ["english"], hemispheres: ["north"] },
  { name: "Japan", continents: ["Asia"], landlocked: false, island: true, populationM: 124, languages: [], hemispheres: ["north"] },
  { name: "Indonesia", continents: ["Asia"], landlocked: false, island: true, populationM: 277, languages: [], hemispheres: ["north", "south"] },
  { name: "Philippines", continents: ["Asia"], landlocked: false, island: true, populationM: 117, languages: ["english"], hemispheres: ["north"] },
  { name: "Kazakhstan", continents: ["Asia"], landlocked: true, island: false, populationM: 20, languages: [], hemispheres: ["north"] },
  { name: "Mongolia", continents: ["Asia"], landlocked: true, island: false, populationM: 3.5, languages: [], hemispheres: ["north"] },
  { name: "Saudi Arabia", continents: ["Asia"], landlocked: false, island: false, populationM: 37, languages: ["arabic"], hemispheres: ["north"] },
  { name: "Thailand", continents: ["Asia"], landlocked: false, island: false, populationM: 71, languages: [], hemispheres: ["north"] },
  { name: "Sri Lanka", continents: ["Asia"], landlocked: false, island: true, populationM: 22, languages: ["english"], hemispheres: ["north"] },
  { name: "United States", continents: ["North America"], landlocked: false, island: false, populationM: 340, languages: ["english"], hemispheres: ["north"] },
  { name: "Canada", continents: ["North America"], landlocked: false, island: false, populationM: 40, languages: ["english", "french"], hemispheres: ["north"] },
  { name: "Mexico", continents: ["North America"], landlocked: false, island: false, populationM: 129, languages: ["spanish"], hemispheres: ["north"] },
  { name: "Cuba", continents: ["North America"], landlocked: false, island: true, populationM: 11, languages: ["spanish"], hemispheres: ["north"] },
  { name: "Dominican Republic", continents: ["North America"], landlocked: false, island: true, populationM: 11, languages: ["spanish"], hemispheres: ["north"] },
  { name: "Jamaica", continents: ["North America"], landlocked: false, island: true, populationM: 3, languages: ["english"], hemispheres: ["north"] },
  { name: "Bahamas", continents: ["North America"], landlocked: false, island: true, populationM: 0.4, languages: ["english"], hemispheres: ["north"] },
  { name: "Brazil", continents: ["South America"], landlocked: false, island: false, populationM: 203, languages: [], hemispheres: ["north", "south"] },
  { name: "Argentina", continents: ["South America"], landlocked: false, island: false, populationM: 46, languages: ["spanish"], hemispheres: ["south"] },
  { name: "Chile", continents: ["South America"], landlocked: false, island: false, populationM: 20, languages: ["spanish"], hemispheres: ["south"] },
  { name: "Colombia", continents: ["South America"], landlocked: false, island: false, populationM: 52, languages: ["spanish"], hemispheres: ["north"] },
  { name: "Peru", continents: ["South America"], landlocked: false, island: false, populationM: 34, languages: ["spanish"], hemispheres: ["south"] },
  { name: "Bolivia", continents: ["South America"], landlocked: true, island: false, populationM: 12, languages: ["spanish"], hemispheres: ["south"] },
  { name: "Paraguay", continents: ["South America"], landlocked: true, island: false, populationM: 7, languages: ["spanish"], hemispheres: ["south"] },
  { name: "Australia", continents: ["Oceania"], landlocked: false, island: true, populationM: 27, languages: ["english"], hemispheres: ["south"] },
  { name: "New Zealand", continents: ["Oceania"], landlocked: false, island: true, populationM: 5, languages: ["english"], hemispheres: ["south"] },
  { name: "Papua New Guinea", continents: ["Oceania"], landlocked: false, island: true, populationM: 10, languages: ["english"], hemispheres: ["south"] },
  { name: "Fiji", continents: ["Oceania"], landlocked: false, island: true, populationM: 1, languages: ["english"], hemispheres: ["south"] },
];

const GRID_CRITERIA = {
  europe: {
    id: "europe",
    label: "In Europe",
    test: (country) => country.continents.includes("Europe"),
  },
  africa: {
    id: "africa",
    label: "In Africa",
    test: (country) => country.continents.includes("Africa"),
  },
  asia: {
    id: "asia",
    label: "In Asia",
    test: (country) => country.continents.includes("Asia"),
  },
  americas: {
    id: "americas",
    label: "In the Americas",
    test: (country) => country.continents.includes("North America") || country.continents.includes("South America"),
  },
  oceania: {
    id: "oceania",
    label: "In Oceania",
    test: (country) => country.continents.includes("Oceania"),
  },
  english: {
    id: "english",
    label: "English-speaking",
    test: (country) => country.languages.includes("english"),
  },
  spanish: {
    id: "spanish",
    label: "Spanish-speaking",
    test: (country) => country.languages.includes("spanish"),
  },
  french: {
    id: "french",
    label: "French-speaking",
    test: (country) => country.languages.includes("french"),
  },
  landlocked: {
    id: "landlocked",
    label: "Landlocked",
    test: (country) => country.landlocked,
  },
  island: {
    id: "island",
    label: "Island nation",
    test: (country) => country.island,
  },
  pop20: {
    id: "pop20",
    label: "Population 20M+",
    test: (country) => country.populationM >= 20,
  },
  pop50: {
    id: "pop50",
    label: "Population 50M+",
    test: (country) => country.populationM >= 50,
  },
};

const GRID_TEMPLATES = [
  {
    rowIds: ["europe", "africa", "asia"],
    colIds: ["landlocked", "island", "pop50"],
  },
  {
    rowIds: ["english", "french", "spanish"],
    colIds: ["island", "landlocked", "pop50"],
  },
  {
    rowIds: ["europe", "africa", "americas"],
    colIds: ["island", "french", "pop50"],
  },
];

const state = {
  puzzles: [],
  current: 0,
  score: 0,
  answered: false,
  modeId: "seterra",
  mapData: null,
  gridBoard: null,
  selectedGridCell: null,
};

const el = {
  intro: document.getElementById("intro"),
  quiz: document.getElementById("quiz"),
  result: document.getElementById("result"),
  locked: document.getElementById("locked"),
  error: document.getElementById("error"),
  question: document.getElementById("question"),
  answers: document.getElementById("answers"),
  feedback: document.getElementById("feedback"),
  nextBtn: document.getElementById("next-btn"),
  progressBar: document.getElementById("progress-bar"),
  progressText: document.getElementById("progress-text"),
  scrambledText: document.getElementById("scrambled-text"),
  scoreText: document.getElementById("score-text"),
  shareStatus: document.getElementById("share-status"),
  lockedMessage: document.getElementById("locked-message"),
  startBtn: document.getElementById("start-btn"),
  shareBtn: document.getElementById("share-btn"),
  retryInfoBtn: document.getElementById("retry-info-btn"),
  reloadBtn: document.getElementById("reload-btn"),
  errorText: document.getElementById("error-text"),
  modeDescription: document.getElementById("mode-description"),
  nextMode: document.getElementById("next-mode"),
  seterraBoard: document.getElementById("seterra-board"),
  geoBoard: document.getElementById("geo-board"),
  geogridBoard: document.getElementById("geogrid-board"),
  guessInput: document.getElementById("guess-input"),
  guessBtn: document.getElementById("guess-btn"),
  hintBtn: document.getElementById("hint-btn"),
  hintText: document.getElementById("hint-text"),
  seterraMap: document.getElementById("seterra-map"),
  seterraOptions: document.getElementById("seterra-options"),
  seterraHelp: document.getElementById("seterra-help"),
  geogridGrid: document.getElementById("geogrid-grid"),
  geogridInput: document.getElementById("geogrid-input"),
  geogridSubmit: document.getElementById("geogrid-submit"),
  geogridHint: document.getElementById("geogrid-hint"),
  geogridStatus: document.getElementById("geogrid-status"),
};

function decodeHtml(value) {
  const parser = document.createElement("textarea");
  parser.innerHTML = value;
  return parser.value;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function scrambleWords(input) {
  return input
    .split(" ")
    .map((word) => {
      const chars = word.split("");
      if (chars.length < 3) {
        return word.toUpperCase();
      }
      for (let i = chars.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }
      return chars.join("").toUpperCase();
    })
    .join("   ");
}

function normalizeName(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z]/g, "");
}

function modeByWindow(ms) {
  const index = Math.floor(ms / QUIZ_WINDOW_MS) % MODES.length;
  return MODES[index];
}

function modeById(id) {
  return MODES.find((mode) => mode.id === id) || MODES[0];
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

function nowMs() {
  return Date.now();
}

function formatDateTime(ms) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}

function isExpired(storage) {
  return !storage?.expiresAt || nowMs() >= storage.expiresAt;
}

function setView(view) {
  [el.intro, el.quiz, el.result, el.locked, el.error].forEach((node) => node.classList.add("hidden"));
  view.classList.remove("hidden");
}

function setModeCopy(mode, nextMode) {
  el.modeDescription.textContent = `${mode.title}: ${mode.description}`;
  el.nextMode.textContent = `Next challenge window switches to ${nextMode.title}.`;
}

function toPuzzle(result) {
  const correct = decodeHtml(result.correct_answer).trim();
  const wrong = result.incorrect_answers.map((item) => decodeHtml(item).trim());
  return {
    clue: decodeHtml(result.question).trim(),
    correct,
    options: shuffle([correct, ...wrong]),
    scrambled: scrambleWords(correct),
  };
}

function resetRoundUi() {
  el.feedback.textContent = "";
  el.feedback.className = "feedback";
  el.nextBtn.classList.add("hidden");
  el.hintText.textContent = "";
  el.guessInput.value = "";
  el.guessInput.disabled = false;
  el.guessBtn.disabled = false;
  el.hintBtn.disabled = false;
  el.geogridStatus.textContent = "";
  el.geogridInput.value = "";
  el.geogridInput.disabled = false;
  el.geogridSubmit.disabled = false;
  el.geogridHint.disabled = false;
}

function geoHintText(country) {
  const parts = country.split(" ").map((word) => word.length).join("-");
  return `Starts with ${country[0].toUpperCase()}, ends with ${country[country.length - 1].toUpperCase()}, letter groups: ${parts}.`;
}

function getFeatureName(feature) {
  const props = feature?.properties || {};
  return props.name || props.admin || props.NAME || props.NAME_EN || props.sovereignt || "";
}

function buildMapIndex(features) {
  const byName = new Map();
  features.forEach((feature) => {
    const rawName = getFeatureName(feature);
    const key = normalizeName(rawName);
    if (!key) {
      return;
    }
    if (!byName.has(key)) {
      byName.set(key, []);
    }
    byName.get(key).push(feature);
  });
  return byName;
}

function countryCandidateKeys(name) {
  const key = normalizeName(name);
  const aliases = COUNTRY_ALIASES[key] || [];
  return [key, ...aliases];
}

function resolveFeature(countryName) {
  const mapData = state.mapData;
  if (!mapData) {
    return null;
  }

  const keys = countryCandidateKeys(countryName);
  for (const key of keys) {
    const features = mapData.byName.get(key);
    if (features && features.length) {
      return features[0];
    }
  }
  return null;
}

function projectPoint(lon, lat) {
  const x = ((lon + 180) / 360) * MAP_WIDTH;
  const y = ((90 - lat) / 180) * MAP_HEIGHT;
  return [x, y];
}

function ringPath(ring) {
  const commands = ring
    .map((coord, index) => {
      const [x, y] = projectPoint(coord[0], coord[1]);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  return `${commands} Z`;
}

function geometryPath(geometry) {
  if (!geometry) {
    return "";
  }

  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((ring) => ringPath(ring)).join(" ");
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((polygon) => polygon.map((ring) => ringPath(ring)).join(" "))
      .join(" ");
  }

  return "";
}

async function loadWorldMapData() {
  if (state.mapData) {
    return state.mapData;
  }

  const response = await fetch(WORLD_GEOJSON_URL);
  if (!response.ok) {
    throw new Error("World map data request failed.");
  }

  const data = await response.json();
  const features = Array.isArray(data.features) ? data.features : [];
  if (!features.length) {
    throw new Error("World map data is empty.");
  }

  const prepared = {
    features,
    byName: buildMapIndex(features),
  };
  state.mapData = prepared;
  return prepared;
}

async function warmSeterraMapData() {
  try {
    await loadWorldMapData();
    return true;
  } catch {
    return false;
  }
}

function renderSeterraOptionList(puzzle) {
  el.seterraOptions.innerHTML = "";
  puzzle.options.forEach((option, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${option}`;
    el.seterraOptions.appendChild(li);
  });
}

function renderSeterraFallbackButtons(puzzle) {
  el.answers.classList.remove("hidden");
  el.answers.innerHTML = "";
  puzzle.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-btn";
    button.textContent = option;
    button.addEventListener("click", () => handleSeterraAnswer(option, button));
    el.answers.appendChild(button);
  });
}

function renderSeterraSvg(puzzle, candidateFeatures) {
  el.answers.classList.add("hidden");
  el.seterraMap.setAttribute("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
  el.seterraMap.innerHTML = "";

  const featureByCountry = new Map(candidateFeatures.map((item) => [item.country, item.feature]));

  state.mapData.features.forEach((feature) => {
    const pathData = geometryPath(feature.geometry);
    if (!pathData) {
      return;
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.classList.add("country-shape");

    const matched = [...featureByCountry.entries()].find(([, candidate]) => candidate === feature);
    if (matched) {
      path.classList.add("candidate");
      path.dataset.country = matched[0];
    }

    el.seterraMap.appendChild(path);
  });

  renderSeterraOptionList(puzzle);

  puzzle.options.forEach((option, index) => {
    const path = el.seterraMap.querySelector(`path[data-country="${option}"]`);
    if (!path) {
      return;
    }
    const box = path.getBBox();
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(box.x + box.width / 2));
    label.setAttribute("y", String(box.y + box.height / 2));
    label.classList.add("option-label");
    label.textContent = String(index + 1);
    el.seterraMap.appendChild(label);
  });

  el.seterraHelp.textContent = "Tap one highlighted country region on the map (numbers match the list).";
}

function renderSeterraRound(puzzle) {
  el.seterraBoard.classList.remove("hidden");
  el.geoBoard.classList.add("hidden");
  el.geogridBoard.classList.add("hidden");

  const candidates = puzzle.options
    .map((country) => ({ country, feature: resolveFeature(country) }))
    .filter((entry) => Boolean(entry.feature));

  if (!state.mapData || candidates.length < 2) {
    renderSeterraOptionList(puzzle);
    renderSeterraFallbackButtons(puzzle);
    el.seterraHelp.textContent = "Map regions unavailable for this set. Using choice buttons instead.";
    el.seterraMap.innerHTML = "";
    return;
  }

  renderSeterraSvg(puzzle, candidates);
}

function renderGeoRound() {
  el.seterraBoard.classList.add("hidden");
  el.geoBoard.classList.remove("hidden");
  el.geogridBoard.classList.add("hidden");
  requestAnimationFrame(() => el.guessInput.focus());
}

function findCountryDataByGuess(value) {
  const normalized = normalizeName(value);
  return COUNTRY_DATA.find((country) => normalizeName(country.name) === normalized) || null;
}

function uniqueFilledGridNames() {
  if (!state.gridBoard) {
    return new Set();
  }
  return new Set(state.gridBoard.cells.flatMap((cell) => (cell.answer ? [normalizeName(cell.answer)] : [])));
}

function buildGeoGridBoard(seedIndex) {
  const template = GRID_TEMPLATES[seedIndex % GRID_TEMPLATES.length];
  const rowCriteria = template.rowIds.map((id) => GRID_CRITERIA[id]);
  const colCriteria = template.colIds.map((id) => GRID_CRITERIA[id]);
  const cells = [];

  rowCriteria.forEach((rowCriterion, rowIndex) => {
    colCriteria.forEach((colCriterion, colIndex) => {
      const validCountries = COUNTRY_DATA.filter(
        (country) => rowCriterion.test(country) && colCriterion.test(country),
      ).map((country) => country.name);

      cells.push({
        id: `${rowIndex}-${colIndex}`,
        rowIndex,
        colIndex,
        validCountries,
        answer: "",
      });
    });
  });

  return {
    rowIds: template.rowIds,
    colIds: template.colIds,
    cells,
  };
}

function restoreGeoGridBoard(rawBoard) {
  if (!rawBoard?.rowIds || !rawBoard?.colIds) {
    return null;
  }

  const rowCriteria = rawBoard.rowIds.map((id) => GRID_CRITERIA[id]).filter(Boolean);
  const colCriteria = rawBoard.colIds.map((id) => GRID_CRITERIA[id]).filter(Boolean);
  if (rowCriteria.length !== 3 || colCriteria.length !== 3) {
    return null;
  }

  const templateIndex = GRID_TEMPLATES.findIndex(
    (template) =>
      template.rowIds.join("|") === rawBoard.rowIds.join("|") &&
      template.colIds.join("|") === rawBoard.colIds.join("|"),
  );
  const fresh = buildGeoGridBoard(templateIndex >= 0 ? templateIndex : 0);

  if (!Array.isArray(rawBoard.cells)) {
    return fresh;
  }

  fresh.cells.forEach((cell) => {
    const savedCell = rawBoard.cells.find((candidate) => candidate.id === cell.id);
    if (savedCell?.answer) {
      cell.answer = savedCell.answer;
    }
  });

  return fresh;
}

function serializeGridBoard(board) {
  return {
    rowIds: board.rowIds,
    colIds: board.colIds,
    cells: board.cells.map((cell) => ({ id: cell.id, answer: cell.answer })),
  };
}

function gridBoardSolvedCount(board) {
  return board.cells.filter((cell) => cell.answer).length;
}

function renderGeoGridBoard() {
  const board = state.gridBoard;
  if (!board) {
    return;
  }

  const rowCriteria = board.rowIds.map((id) => GRID_CRITERIA[id]);
  const colCriteria = board.colIds.map((id) => GRID_CRITERIA[id]);
  const solvedCount = gridBoardSolvedCount(board);

  el.seterraBoard.classList.add("hidden");
  el.geoBoard.classList.add("hidden");
  el.geogridBoard.classList.remove("hidden");

  el.progressText.textContent = `GeoGrid board - ${solvedCount}/9 solved`;
  el.progressBar.style.width = `${(solvedCount / 9) * 100}%`;
  el.scrambledText.textContent = "3 x 3";
  el.question.textContent = "Select a cell and enter a country that satisfies both clues.";
  el.geogridGrid.innerHTML = "";

  const corner = document.createElement("div");
  corner.className = "geogrid-corner";
  corner.textContent = "GeoGrid";
  el.geogridGrid.appendChild(corner);

  colCriteria.forEach((criterion) => {
    const header = document.createElement("div");
    header.className = "geogrid-header geogrid-col-header";
    header.textContent = criterion.label;
    el.geogridGrid.appendChild(header);
  });

  rowCriteria.forEach((criterion, rowIndex) => {
    const rowHeader = document.createElement("div");
    rowHeader.className = "geogrid-header geogrid-row-header";
    rowHeader.textContent = criterion.label;
    el.geogridGrid.appendChild(rowHeader);

    for (let colIndex = 0; colIndex < 3; colIndex += 1) {
      const cell = board.cells.find((candidate) => candidate.rowIndex === rowIndex && candidate.colIndex === colIndex);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "geogrid-cell";
      button.dataset.cellId = cell.id;
      button.textContent = cell.answer || "Select";
      if (cell.answer) {
        button.classList.add("solved");
      }
      if (state.selectedGridCell === cell.id && !cell.answer) {
        button.classList.add("selected");
      }
      button.addEventListener("click", () => selectGridCell(cell.id));
      el.geogridGrid.appendChild(button);
    }
  });

  el.geogridStatus.textContent = solvedCount === 9
    ? "Board complete."
    : state.selectedGridCell
      ? "Enter a country for the selected cell."
      : "Tap a cell to start filling the board.";

  el.nextBtn.classList.toggle("hidden", solvedCount !== 9);
}

function selectGridCell(cellId) {
  const board = state.gridBoard;
  if (!board) {
    return;
  }
  const cell = board.cells.find((candidate) => candidate.id === cellId);
  if (!cell || cell.answer) {
    return;
  }
  state.selectedGridCell = cellId;
  renderGeoGridBoard();
  requestAnimationFrame(() => el.geogridInput.focus());
}

function renderPuzzle() {
  const mode = modeById(state.modeId);

  resetRoundUi();
  state.answered = false;

  if (mode.id === "geogrid") {
    renderGeoGridBoard();
    return;
  }

  const puzzle = state.puzzles[state.current];
  const index = state.current + 1;
  el.progressText.textContent = `${mode.title} - Puzzle ${index} of ${state.puzzles.length}`;
  el.progressBar.style.width = `${((index - 1) / state.puzzles.length) * 100}%`;
  el.scrambledText.textContent = puzzle.scrambled;
  el.question.textContent = puzzle.clue;

  if (mode.id === "seterra") {
    renderSeterraRound(puzzle);
  } else {
    renderGeoRound();
  }
}

function finalizeRound(isCorrect) {
  if (isCorrect) {
    state.score += 1;
    el.feedback.textContent = "Correct.";
    el.feedback.classList.add("correct");
  } else {
    el.feedback.classList.add("wrong");
  }

  el.nextBtn.textContent = state.current === state.puzzles.length - 1 ? "See Results" : "Next Puzzle";
  el.nextBtn.classList.remove("hidden");
  state.answered = true;
}

function handleSeterraAnswer(selectedOption, originEl = null) {
  if (state.answered) {
    return;
  }

  const puzzle = state.puzzles[state.current];
  const isCorrect = selectedOption === puzzle.correct;

  if (!el.answers.classList.contains("hidden")) {
    [...el.answers.children].forEach((btn) => {
      btn.disabled = true;
      if (btn.textContent === puzzle.correct) {
        btn.classList.add("correct");
      }
    });
    if (!isCorrect && originEl) {
      originEl.classList.add("wrong");
    }
  } else {
    const paths = el.seterraMap.querySelectorAll("path[data-country]");
    paths.forEach((path) => {
      if (path.dataset.country === puzzle.correct) {
        path.classList.add("correct");
      }
    });
    if (!isCorrect && originEl) {
      originEl.classList.add("wrong");
    }
  }

  if (!isCorrect) {
    el.feedback.textContent = `Wrong location. Correct answer: ${puzzle.correct}.`;
  }

  finalizeRound(isCorrect);
}

function handleGeoGuess() {
  if (state.answered) {
    return;
  }

  const puzzle = state.puzzles[state.current];
  const guess = el.guessInput.value.trim();
  const isCorrect = normalizeName(guess) === normalizeName(puzzle.correct);

  el.guessInput.disabled = true;
  el.guessBtn.disabled = true;
  el.hintBtn.disabled = true;

  if (!isCorrect) {
    el.feedback.textContent = `Not quite. Correct answer: ${puzzle.correct}.`;
  }

  finalizeRound(isCorrect);
}

function showGeoHint() {
  if (state.answered) {
    return;
  }
  const puzzle = state.puzzles[state.current];
  el.hintText.textContent = geoHintText(puzzle.correct);
}

function persistActiveSession() {
  const storage = getActiveStorage();
  if (!storage) {
    return;
  }

  if (state.modeId === "geogrid" && state.gridBoard) {
    writeStorage({
      ...storage,
      gridBoard: serializeGridBoard(state.gridBoard),
    });
  }
}

function finishGeoGridBoard() {
  const startedAt = nowMs();
  const expiresAt = startedAt + QUIZ_WINDOW_MS;
  const percentage = Math.round((state.score / 9) * 100);

  writeStorage({
    completed: true,
    score: state.score,
    total: 9,
    startedAt,
    expiresAt,
    modeId: state.modeId,
    gridBoard: serializeGridBoard(state.gridBoard),
  });

  el.scoreText.textContent = `GeoGrid style: you solved ${state.score}/9 cells (${percentage}%).`;
  el.progressBar.style.width = "100%";
  el.shareStatus.textContent = "";
  setView(el.result);
}

function handleGeoGridSubmit() {
  const board = state.gridBoard;
  if (!board || !state.selectedGridCell) {
    el.geogridStatus.textContent = "Select a cell before entering a country.";
    return;
  }

  const cell = board.cells.find((candidate) => candidate.id === state.selectedGridCell);
  if (!cell || cell.answer) {
    el.geogridStatus.textContent = "Choose an unsolved cell.";
    return;
  }

  const guessedCountry = findCountryDataByGuess(el.geogridInput.value.trim());
  if (!guessedCountry) {
    el.geogridStatus.textContent = "That country is not in the current grid dictionary. Try a widely used country name.";
    return;
  }

  const usedNames = uniqueFilledGridNames();
  if (usedNames.has(normalizeName(guessedCountry.name))) {
    el.geogridStatus.textContent = "That country is already used elsewhere on the board.";
    return;
  }

  const validMatch = cell.validCountries.find(
    (countryName) => normalizeName(countryName) === normalizeName(guessedCountry.name),
  );

  if (!validMatch) {
    el.geogridStatus.textContent = `${guessedCountry.name} does not satisfy both clues for this cell.`;
    return;
  }

  cell.answer = validMatch;
  state.score = gridBoardSolvedCount(board);
  state.selectedGridCell = null;
  el.geogridInput.value = "";
  el.feedback.textContent = "Correct grid fill.";
  el.feedback.className = "feedback correct";
  persistActiveSession();
  renderGeoGridBoard();

  if (state.score === 9) {
    finishGeoGridBoard();
  }
}

function showGeoGridHint() {
  const board = state.gridBoard;
  if (!board || !state.selectedGridCell) {
    el.geogridStatus.textContent = "Select a cell to see a hint.";
    return;
  }

  const cell = board.cells.find((candidate) => candidate.id === state.selectedGridCell);
  if (!cell) {
    return;
  }

  const examples = cell.validCountries.slice(0, 3).join(", ");
  el.geogridStatus.textContent = `Possible fits include: ${examples}.`;
}

function finishPuzzleSet() {
  const startedAt = nowMs();
  const expiresAt = startedAt + QUIZ_WINDOW_MS;
  const mode = modeById(state.modeId);

  writeStorage({
    completed: true,
    score: state.score,
    total: state.puzzles.length,
    puzzles: state.puzzles,
    startedAt,
    expiresAt,
    modeId: state.modeId,
  });

  const percentage = Math.round((state.score / state.puzzles.length) * 100);
  el.scoreText.textContent = `${mode.title}: you solved ${state.score}/${state.puzzles.length} puzzles (${percentage}%).`;
  el.progressBar.style.width = "100%";
  el.shareStatus.textContent = "";
  setView(el.result);
}

function nextStep() {
  if (state.modeId === "geogrid") {
    if (state.score === 9) {
      finishGeoGridBoard();
    }
    return;
  }

  if (!state.answered) {
    return;
  }

  if (state.current === state.puzzles.length - 1) {
    finishPuzzleSet();
    return;
  }

  state.current += 1;
  renderPuzzle();
}

async function fetchPuzzles() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Puzzle API request failed.");
  }

  const data = await response.json();
  if (data.response_code !== 0 || !Array.isArray(data.results) || data.results.length !== 5) {
    throw new Error("Puzzle API returned unexpected data.");
  }

  return data.results.map(toPuzzle);
}

function getActiveStorage() {
  const storage = readStorage();
  if (!storage) {
    return null;
  }

  if (isExpired(storage)) {
    clearStorage();
    return null;
  }

  return storage;
}

function lockForWindow(storage) {
  const score = Number.isFinite(storage.score) ? storage.score : 0;
  const total = Number.isFinite(storage.total) ? storage.total : 5;
  const unlockAt = Number.isFinite(storage.expiresAt) ? formatDateTime(storage.expiresAt) : "in 24 hours";
  const mode = modeById(storage.modeId);
  el.lockedMessage.textContent = `${mode.title}: you already solved today's set (${score}/${total}). Next unlock: ${unlockAt}.`;
  setView(el.locked);
}

async function startPuzzles() {
  el.startBtn.disabled = true;
  el.startBtn.textContent = "Loading...";

  try {
    const storage = getActiveStorage();

    if (storage?.completed) {
      lockForWindow(storage);
      return;
    }

    if (storage?.modeId) {
      state.modeId = storage.modeId;
      if (state.modeId === "geogrid") {
        state.gridBoard = restoreGeoGridBoard(storage.gridBoard) || buildGeoGridBoard(Math.floor((storage.startedAt || nowMs()) / QUIZ_WINDOW_MS));
      } else if (Array.isArray(storage.puzzles) && storage.puzzles.length === 5) {
        state.puzzles = storage.puzzles;
      }
    } else {
      const startedAt = nowMs();
      state.modeId = modeByWindow(startedAt).id;

      if (state.modeId === "geogrid") {
        state.gridBoard = buildGeoGridBoard(Math.floor(startedAt / QUIZ_WINDOW_MS));
        writeStorage({
          completed: false,
          score: 0,
          total: 9,
          startedAt,
          expiresAt: startedAt + QUIZ_WINDOW_MS,
          modeId: state.modeId,
          gridBoard: serializeGridBoard(state.gridBoard),
        });
      } else {
        state.puzzles = await fetchPuzzles();
        writeStorage({
          completed: false,
          score: 0,
          total: state.puzzles.length,
          puzzles: state.puzzles,
          startedAt,
          expiresAt: startedAt + QUIZ_WINDOW_MS,
          modeId: state.modeId,
        });
      }
    }

    if (state.modeId === "seterra") {
      await warmSeterraMapData();
    }

    state.current = 0;
    state.score = state.modeId === "geogrid" ? gridBoardSolvedCount(state.gridBoard) : 0;
    state.selectedGridCell = null;
    setView(el.quiz);
    renderPuzzle();
  } catch (error) {
    setView(el.error);
    el.errorText.textContent = error instanceof Error ? error.message : "Failed to load puzzle set.";
  } finally {
    el.startBtn.disabled = false;
    el.startBtn.textContent = "Start Today's Puzzle Set";
  }
}

async function shareScore() {
  const mode = modeById(state.modeId);
  const total = state.modeId === "geogrid" ? 9 : 5;
  const text = `I solved ${state.score}/${total} in today's ${mode.title} Geography Challenge. New mode every 24 hours.`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: "Daily Geography Puzzle",
        text,
      });
      el.shareStatus.textContent = "Shared.";
      return;
    }

    await navigator.clipboard.writeText(text);
    el.shareStatus.textContent = "Result copied to clipboard.";
  } catch {
    el.shareStatus.textContent = "Could not share right now.";
  }
}

function init() {
  const currentMode = modeByWindow(nowMs());
  const nextMode = modeByWindow(nowMs() + QUIZ_WINDOW_MS);
  setModeCopy(currentMode, nextMode);

  const storage = getActiveStorage();
  if (storage?.completed) {
    lockForWindow(storage);
  } else {
    setView(el.intro);
  }

  el.startBtn.addEventListener("click", startPuzzles);
  el.nextBtn.addEventListener("click", nextStep);
  el.shareBtn.addEventListener("click", shareScore);
  el.guessBtn.addEventListener("click", handleGeoGuess);
  el.hintBtn.addEventListener("click", showGeoHint);
  el.geogridSubmit.addEventListener("click", handleGeoGridSubmit);
  el.geogridHint.addEventListener("click", showGeoGridHint);
  el.guessInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleGeoGuess();
    }
  });
  el.geogridInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleGeoGridSubmit();
    }
  });
  el.seterraMap.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof SVGPathElement)) {
      return;
    }
    const country = target.dataset.country;
    if (!country) {
      return;
    }
    handleSeterraAnswer(country, target);
  });
  el.retryInfoBtn.addEventListener("click", () => {
    const active = getActiveStorage();
    if (active?.expiresAt) {
      el.shareStatus.textContent = `Your next puzzle set unlocks ${formatDateTime(active.expiresAt)}.`;
    } else {
      el.shareStatus.textContent = "The next puzzle set opens 24 hours after you start today's set.";
    }
  });
  el.reloadBtn.addEventListener("click", () => window.location.reload());
}

init();

// @ts-check

import { isValidHexColor } from "../common/color.js";
import { encodeHTML } from "../common/html.js";

/**
 * @typedef {Object} StreakCardColors
 * @property {string} background Card background color (hex without #).
 * @property {string} stroke Card border/stroke color (hex without #).
 * @property {string} ring Ring around the center value color.
 * @property {string} fire Fire emoji accent color (used for active streak label).
 * @property {string} currStreakLabel Current streak label color.
 * @property {string} sideLabels Side panel label colors.
 * @property {string} dates Date range text color.
 * @property {string} currStreakNum Current streak number color.
 * @property {string} sideNums Side panel number colors.
 */

/**
 * @typedef {Object} StreakTheme
 * @property {string} background Background hex.
 * @property {string} stroke Stroke hex.
 * @property {string} ring Ring hex.
 * @property {string} fire Fire hex.
 * @property {string} currStreakLabel Current streak label hex.
 * @property {string} sideLabels Side label hex.
 * @property {string} dates Date text hex.
 */

/**
 * Built-in themes matching the reference streak-stats project's themes.
 *
 * @type {Record<string, StreakTheme>}
 */
const STREAK_THEMES = {
  default: {
    background: "ffffff",
    stroke: "e4e2e2",
    ring: "fb8c00",
    fire: "fb8c00",
    currStreakLabel: "fb8c00",
    sideLabels: "333333",
    dates: "444444",
  },
  dark: {
    background: "1c1c1c",
    stroke: "444444",
    ring: "f5a623",
    fire: "f5a623",
    currStreakLabel: "f5a623",
    sideLabels: "e0e0e0",
    dates: "c0c0c0",
  },
  tokyonight: {
    background: "1a1b27",
    stroke: "414868",
    ring: "70a5fd",
    fire: "bf91f3",
    currStreakLabel: "38bdae",
    sideLabels: "9ca3af",
    dates: "9ca3af",
  },
  radical: {
    background: "141321",
    stroke: "fe428e",
    ring: "fe428e",
    fire: "fe428e",
    currStreakLabel: "fe428e",
    sideLabels: "a9fef7",
    dates: "a9fef7",
  },
  merko: {
    background: "0a0f0b",
    stroke: "68b587",
    ring: "68b587",
    fire: "68b587",
    currStreakLabel: "68b587",
    sideLabels: "b7d5be",
    dates: "68b587",
  },
  gruvbox: {
    background: "282828",
    stroke: "d5c4a1",
    ring: "d5c4a1",
    fire: "d5c4a1",
    currStreakLabel: "d5c4a1",
    sideLabels: "ebdbb2",
    dates: "a89984",
  },
  monokai: {
    background: "272822",
    stroke: "75715e",
    ring: "f8f8f2",
    fire: "f92672",
    currStreakLabel: "f92672",
    sideLabels: "f8f8f2",
    dates: "75715e",
  },
  vue: {
    background: "fffefe",
    stroke: "41b883",
    ring: "41b883",
    fire: "41b883",
    currStreakLabel: "41b883",
    sideLabels: "495057",
    dates: "9f9f9f",
  },
  "vue-dark": {
    background: "213b2e",
    stroke: "41b883",
    ring: "41b883",
    fire: "41b883",
    currStreakLabel: "41b883",
    sideLabels: "c9d1d9",
    dates: "8b949e",
  },
  "shades-of-purple": {
    background: "2b213a",
    stroke: "4d3a99",
    ring: "4d3a99",
    fire: "f9a825",
    currStreakLabel: "f9a825",
    sideLabels: "ffffff",
    dates: "8c8ea1",
  },
  nightowl: {
    background: "011627",
    stroke: "1f4271",
    ring: "c792ea",
    fire: "c792ea",
    currStreakLabel: "c792ea",
    sideLabels: "d6deeb",
    dates: "7fdbca",
  },
  buefy: {
    background: "ffffff",
    stroke: "7957d5",
    ring: "7957d5",
    fire: "7957d5",
    currStreakLabel: "7957d5",
    sideLabels: "363636",
    dates: "7a7a7a",
  },
  "blue-green": {
    background: "1b4a52",
    stroke: "18d2a6",
    ring: "18d2a6",
    fire: "18d2a6",
    currStreakLabel: "18d2a6",
    sideLabels: "b5e9e0",
    dates: "78c6bb",
  },
  algolia: {
    background: "050f2c",
    stroke: "0072d6",
    ring: "0072d6",
    fire: "0072d6",
    currStreakLabel: "0072d6",
    sideLabels: "ffffff",
    dates: "9fa7cf",
  },
  "great-gatsby": {
    background: "000000",
    stroke: "ffa726",
    ring: "ffa726",
    fire: "ffa726",
    currStreakLabel: "ffa726",
    sideLabels: "d0aa45",
    dates: "e3be5e",
  },
  "dark-consumable": {
    background: "050505",
    stroke: "121212",
    ring: "79c0ff",
    fire: "79c0ff",
    currStreakLabel: "79c0ff",
    sideLabels: "c0d0d0",
    dates: "909090",
  },
  apprentice: {
    background: "282828",
    stroke: "5f8787",
    ring: "5f8787",
    fire: "5f8787",
    currStreakLabel: "5f8787",
    sideLabels: "d0d0d0",
    dates: "a0a0a0",
  },
  "city-lights": {
    background: "1d252c",
    stroke: "547a96",
    ring: "547a96",
    fire: "547a96",
    currStreakLabel: "547a96",
    sideLabels: "b7c5d3",
    dates: "718ca1",
  },
  github: {
    background: "ffffff",
    stroke: "e1e4e8",
    ring: "2188ff",
    fire: "e36209",
    currStreakLabel: "2188ff",
    sideLabels: "586069",
    dates: "6a737d",
  },
  "github-compact": {
    background: "ffffff",
    stroke: "e1e4e8",
    ring: "2188ff",
    fire: "e36209",
    currStreakLabel: "2188ff",
    sideLabels: "586069",
    dates: "6a737d",
  },
  "github-dark": {
    background: "0d1117",
    stroke: "30363d",
    ring: "58a6ff",
    fire: "c56207",
    currStreakLabel: "58a6ff",
    sideLabels: "8b949e",
    dates: "8b949e",
  },
  "github-dark-blue": {
    background: "0d1117",
    stroke: "1f6feb",
    ring: "1f6feb",
    fire: "c56207",
    currStreakLabel: "1f6feb",
    sideLabels: "8b949e",
    dates: "8b949e",
  },
  dracula: {
    background: "282a36",
    stroke: "ff79c6",
    ring: "ff79c6",
    fire: "ffb86c",
    currStreakLabel: "ff79c6",
    sideLabels: "f8f8f2",
    dates: "6272a4",
  },
  prussian: {
    background: "172f45",
    stroke: "38598b",
    ring: "38598b",
    fire: "e85d04",
    currStreakLabel: "4a8ab5",
    sideLabels: "cdd9e5",
    dates: "7d9ab5",
  },
  monochromes: {
    background: "ffffff",
    stroke: "c0c0c0",
    ring: "787878",
    fire: "787878",
    currStreakLabel: "787878",
    sideLabels: "000000",
    dates: "606060",
  },
};

/**
 * Resolves a hex color value — accepts with or without leading `#`.
 * Returns the color prefixed with `#` if valid, otherwise the fallback.
 *
 * @param {string|undefined} input User-supplied color value.
 * @param {string} fallback Fallback hex color (without #).
 * @returns {string} Resolved color with `#` prefix.
 */
const resolveColor = (input, fallback) => {
  if (!input) {
    return `#${fallback}`;
  }
  const stripped = input.startsWith("#") ? input.slice(1) : input;
  return isValidHexColor(stripped) ? `#${stripped}` : `#${fallback}`;
};

/**
 * Formats a date string (YYYY-MM-DD) into a human-readable short form
 * like "Aug 18, 2026".
 *
 * @param {string} dateStr ISO date string (YYYY-MM-DD).
 * @returns {string} Formatted date.
 */
const formatDisplayDate = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[month - 1]} ${day}, ${year}`;
};

/**
 * Renders a date range string for a streak panel.
 * If start === end, shows a single date; otherwise shows "Start – End".
 *
 * @param {string} start Start date (YYYY-MM-DD).
 * @param {string} end End date (YYYY-MM-DD).
 * @param {number} length Streak length in days.
 * @returns {string} Human-readable date range.
 */
const renderDateRange = (start, end, length) => {
  if (length === 0) {
    return "No contributions yet";
  }
  if (start === end) {
    return formatDisplayDate(start);
  }
  return `${formatDisplayDate(start)} – ${formatDisplayDate(end)}`;
};

/**
 * @typedef {Object} StreakCardOptions
 * @property {string} [theme] Theme name.
 * @property {string} [background] Background color hex.
 * @property {string} [stroke] Border stroke color hex.
 * @property {string} [ring] Ring color hex.
 * @property {string} [fire] Fire/accent color hex.
 * @property {string} [currStreakLabel] Current streak label color hex.
 * @property {string} [sideLabels] Side panel label color hex.
 * @property {string} [dates] Date range text color hex.
 * @property {boolean} [hide_border] Whether to hide the card border.
 * @property {string|number} [border_radius] Border radius of the card.
 */

/**
 * @typedef {import('../fetchers/streak.js').StreakData} StreakData
 */

/**
 * Renders the GitHub streak stats SVG card.
 *
 * @param {StreakData} data Streak data from the fetcher.
 * @param {StreakCardOptions} options Card styling options.
 * @returns {string} SVG markup string.
 */
const renderStreakCard = (data, options = {}) => {
  const {
    theme = "default",
    background: bgParam,
    stroke: strokeParam,
    ring: ringParam,
    fire: fireParam,
    currStreakLabel: currStreakLabelParam,
    sideLabels: sideLabelsParam,
    dates: datesParam,
    hide_border = false,
    border_radius = 4.5,
  } = options;

  // Resolve theme base, then override with per-param values
  const themeKey =
    typeof theme === "string" && theme in STREAK_THEMES ? theme : "default";
  const base = STREAK_THEMES[themeKey];

  const bgColor = resolveColor(bgParam, base.background);
  const strokeColor = resolveColor(strokeParam, base.stroke);
  const ringColor = resolveColor(ringParam, base.ring);
  const fireColor = resolveColor(fireParam, base.fire);
  const currLabelColor = resolveColor(
    currStreakLabelParam,
    base.currStreakLabel,
  );
  const sideLabelColor = resolveColor(sideLabelsParam, base.sideLabels);
  const dateColor = resolveColor(datesParam, base.dates);

  const radius =
    typeof border_radius === "number"
      ? border_radius
      : parseFloat(String(border_radius)) || 4.5;

  const { totalContributions, currentStreak, longestStreak } = data;

  // Current streak text color: use fireColor when active, otherwise sideLabel
  const currNumColor = currentStreak.length > 0 ? ringColor : sideLabelColor;

  // SVG dimensions — matches streak-stats.demolab.com proportions
  const W = 495;
  const H = 195;
  const divX1 = W / 3;
  const divX2 = (2 * W) / 3;
  const centerX = W / 2;
  const centerY = H / 2;
  const ringR = 40;

  // ── Ring animation ─────────────────────────────────────────────────────
  const ringCircumference = 2 * Math.PI * ringR;
  const hasStreak = currentStreak.length > 0;

  // ── Text helpers ───────────────────────────────────────────────────────
  const totalDateRange = renderDateRange(
    data.firstContribution || currentStreak.start,
    new Date().toISOString().split("T")[0],
    totalContributions,
  );

  const currentDateRange = renderDateRange(
    currentStreak.start,
    currentStreak.end,
    currentStreak.length,
  );

  const longestDateRange = renderDateRange(
    longestStreak.start,
    longestStreak.end,
    longestStreak.length,
  );

  // Fire emoji + "DAYS" label on the same row above the ring
  // Both elements share the same y-coordinate so they appear side-by-side.
  const fireRowY = centerY - ringR - 13;
  const fireSvg = hasStreak
    ? `<text text-anchor="middle" x="${centerX}" y="${fireRowY}"
         font-family="'Segoe UI', Ubuntu, Sans-Serif" font-size="13"
         dominant-baseline="middle">
        <tspan fill="${fireColor}">🔥</tspan
        ><tspan fill="${currLabelColor}" dx="4" font-weight="600"> DAYS</tspan>
       </text>`
    : `<text class="label" text-anchor="middle" x="${centerX}" y="${fireRowY}"
        dominant-baseline="middle" fill="${currLabelColor}">DAYS</text>`;

  const borderStrokeOpacity = hide_border ? "0" : "1";

  return `<svg xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${W}" height="${H}"
  viewBox="0 0 ${W} ${H}"
  role="img"
  aria-labelledby="streak-title">

  <title id="streak-title">GitHub Streak Stats</title>

  <defs>
    <style>
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to   { opacity: 1; transform: translateY(0);   }
      }
      @keyframes ringFill {
        from { stroke-dashoffset: ${ringCircumference.toFixed(2)}; }
        to   { stroke-dashoffset: ${hasStreak ? "0" : ringCircumference.toFixed(2)}; }
      }
      .label {
        font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif;
        animation: fadeIn 0.6s ease-in-out forwards;
      }
      .number {
        font: 700 28px 'Segoe UI', Ubuntu, Sans-Serif;
        animation: fadeIn 0.6s ease-in-out forwards;
        animation-delay: 0.1s;
        opacity: 0;
      }
      .date-range {
        font: 400 11px 'Segoe UI', Ubuntu, Sans-Serif;
        animation: fadeIn 0.6s ease-in-out forwards;
        animation-delay: 0.2s;
        opacity: 0;
      }
      .ring-track {
        fill: none;
        stroke: ${ringColor};
        stroke-opacity: 0.2;
        stroke-width: 5;
      }
      .ring-fill {
        fill: none;
        stroke: ${ringColor};
        stroke-width: 5;
        stroke-linecap: round;
        stroke-dasharray: ${ringCircumference.toFixed(2)};
        stroke-dashoffset: ${ringCircumference.toFixed(2)};
        transform: rotate(-90deg);
        transform-origin: ${centerX}px ${centerY}px;
        animation: ringFill 1s ease-in-out forwards;
        animation-delay: 0.3s;
      }
      .divider {
        stroke: ${strokeColor};
        stroke-width: 1;
        stroke-opacity: 0.5;
      }
    </style>
  </defs>

  <!-- Background -->
  <rect
    x="0.5" y="0.5"
    rx="${radius}" ry="${radius}"
    width="${W - 1}" height="${H - 1}"
    fill="${bgColor}"
    stroke="${strokeColor}"
    stroke-opacity="${borderStrokeOpacity}" />

  <!-- Dividers -->
  <line class="divider" x1="${divX1}" y1="25" x2="${divX1}" y2="${H - 25}" />
  <line class="divider" x1="${divX2}" y1="25" x2="${divX2}" y2="${H - 25}" />

  <!-- ── LEFT PANEL: Total Contributions ──────────────────────────────── -->
  <g transform="translate(${divX1 / 2}, ${centerY})">
    <text class="label" text-anchor="middle" y="-58" fill="${sideLabelColor}">Total Contributions</text>
    <text class="number" text-anchor="middle" y="-16" fill="${sideLabelColor}">${totalContributions}</text>
    <text class="date-range" text-anchor="middle" y="14" fill="${dateColor}">${encodeHTML(totalDateRange)}</text>
  </g>

  <!-- ── CENTER PANEL: Current Streak ─────────────────────────────────── -->
  <!-- Ring track -->
  <circle class="ring-track" cx="${centerX}" cy="${centerY}" r="${ringR}" />
  <!-- Ring fill (animated) -->
  <circle class="ring-fill" cx="${centerX}" cy="${centerY}" r="${ringR}" />

  <!-- Fire emoji above ring -->
  ${fireSvg}

  <g transform="translate(${centerX}, ${centerY})">
    <!-- Streak number inside ring -->
    <text class="number" text-anchor="middle" y="9" fill="${currNumColor}">${currentStreak.length}</text>
  </g>

  <!-- Labels below ring -->
  <text class="label" text-anchor="middle"
    x="${centerX}" y="${centerY + ringR + 22}"
    fill="${currLabelColor}">Current Streak</text>
  <text class="date-range" text-anchor="middle"
    x="${centerX}" y="${centerY + ringR + 40}"
    fill="${dateColor}">${encodeHTML(currentDateRange)}</text>

  <!-- Fire + Days label rendered inline via fireSvg above -->

  <!-- ── RIGHT PANEL: Longest Streak ──────────────────────────────────── -->
  <g transform="translate(${divX2 + divX1 / 2}, ${centerY})">
    <text class="label" text-anchor="middle" y="-58" fill="${sideLabelColor}">Longest Streak</text>
    <text class="number" text-anchor="middle" y="-16" fill="${sideLabelColor}">${longestStreak.length}</text>
    <text class="date-range" text-anchor="middle" y="14" fill="${dateColor}">${encodeHTML(longestDateRange)}</text>
  </g>

</svg>`;
};

export { renderStreakCard, STREAK_THEMES };
export default renderStreakCard;

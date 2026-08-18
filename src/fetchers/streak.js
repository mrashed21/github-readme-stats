// @ts-check

import * as dotenv from "dotenv";
import githubUsernameRegex from "github-username-regex";
import { retryer } from "../common/retryer.js";
import { request } from "../common/http.js";
import { MissingParamError } from "../common/error.js";

dotenv.config();

/**
 * GraphQL query to retrieve the contribution calendar for the past year and user creation date.
 */
const STREAK_QUERY = `
  query userContributions($login: String!) {
    user(login: $login) {
      createdAt
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              contributionLevel
              date
            }
          }
        }
      }
    }
  }
`;

/**
 * Builds a GraphQL query to fetch a single year of contributions.
 * @param {string} login GitHub username.
 * @param {number} year Year to fetch.
 * @returns {string} GraphQL query string.
 */
const buildYearQuery = (login, year) => {
  return `query userContributionsHistory($login: String!) {
    user(login: $login) {
      contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") {
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
              contributionLevel
              date
            }
          }
        }
      }
    }
  }`;
};

/**
 * Fetcher function that wraps the GraphQL request for use with retryer.
 * Falls back to GITHUB_TOKEN when the PAT_N token slot is empty.
 *
 * @param {{ login: string }} variables GraphQL variables.
 * @param {string} token GitHub API token from retryer.
 * @returns {Promise<import('axios').AxiosResponse>} Axios response.
 */
const streakFetcher = (variables, token) => {
  const resolvedToken = token || process.env.GITHUB_TOKEN || "";
  return request(
    { query: STREAK_QUERY, variables },
    { Authorization: `bearer ${resolvedToken}` },
  );
};

/**
 * @typedef {Object} StreakDay
 * @property {number} contributionCount Number of contributions on this day.
 * @property {string} date ISO date string (YYYY-MM-DD).
 */

/**
 * @typedef {Object} StreakRange
 * @property {string} start ISO date of the first day of the streak.
 * @property {string} end ISO date of the last day of the streak.
 * @property {number} length Number of days in the streak.
 */

/**
 * @typedef {Object} StreakData
 * @property {number} totalContributions Total contributions across all fetched years.
 * @property {StreakRange} currentStreak Current streak stats.
 * @property {StreakRange} longestStreak Longest streak stats.
 * @property {string|null} firstContribution ISO date of the first contribution day, or null.
 */

/**
 * Formats a Date object as an ISO date string (YYYY-MM-DD) in UTC.
 *
 * @param {Date} date The date to format.
 * @returns {string} Formatted date string.
 */
const formatDate = (date) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Computes the current date string in UTC (today).
 *
 * @returns {string} Today's date as YYYY-MM-DD.
 */
const todayStr = () => formatDate(new Date());

/**
 * Calculates streak statistics from a flat, chronologically-ordered list of
 * contribution days.
 *
 * @param {StreakDay[]} days Ordered array of contribution days (oldest first).
 * @returns {{ currentStreak: StreakRange, longestStreak: StreakRange, firstContribution: string|null }} Streak statistics.
 */
const calculateStreaks = (days) => {
  const today = todayStr();

  /** @type {string|null} */
  let firstContribution = null;

  // ── Longest streak ──────────────────────────────────────────────────────
  let longestLength = 0;
  let longestStart = "";
  let longestEnd = "";
  let runLength = 0;
  let runStart = "";

  for (const day of days) {
    if (day.contributionCount > 0) {
      if (firstContribution === null) {
        firstContribution = day.date;
      }
      if (runLength === 0) {
        runStart = day.date;
      }
      runLength++;
      if (runLength > longestLength) {
        longestLength = runLength;
        longestStart = runStart;
        longestEnd = day.date;
      }
    } else {
      runLength = 0;
    }
  }

  // ── Current streak ───────────────────────────────────────────────────────
  // Walk backwards from today. If today has 0 contributions we allow a one-day
  // grace (yesterday still counts as "current").
  const reversed = [...days].reverse();

  let curLength = 0;
  let curStart = today;
  let curEnd = today;
  let graceUsed = false;

  for (const day of reversed) {
    if (day.date > today) {
      continue; // skip future days (shouldn't exist but be safe)
    }

    if (day.contributionCount > 0) {
      if (curLength === 0) {
        curEnd = day.date;
      }
      curStart = day.date;
      curLength++;
    } else {
      // Allow one grace day (today may not have contributions yet)
      if (!graceUsed && day.date === today) {
        graceUsed = true;
        continue;
      }
      break;
    }
  }

  /** @type {StreakRange} */
  const currentStreak = {
    start: curLength > 0 ? curStart : today,
    end: curLength > 0 ? curEnd : today,
    length: curLength,
  };

  /** @type {StreakRange} */
  const longestStreakResult = {
    start: longestLength > 0 ? longestStart : today,
    end: longestLength > 0 ? longestEnd : today,
    length: longestLength,
  };

  return {
    currentStreak,
    longestStreak: longestStreakResult,
    firstContribution,
  };
};

/**
 * Fetches GitHub contribution streak data for a given username.
 *
 * @param {string} username GitHub username.
 * @returns {Promise<StreakData>} Streak statistics.
 */
const fetchStreak = async (username) => {
  if (!username) {
    throw new MissingParamError(["user"]);
  }

  if (!githubUsernameRegex.test(username)) {
    throw new Error("Invalid GitHub username.");
  }

  const res = await retryer(streakFetcher, { login: username });

  if (res.data.errors) {
    const err = res.data.errors[0];
    if (err.type === "NOT_FOUND") {
      throw new Error(
        `Could not find user "${username}". Make sure the username is correct.`,
      );
    }
    throw new Error(err.message || "GitHub API returned an error.");
  }

  if (!res.data.data || !res.data.data.user) {
    throw new Error(`Could not find user "${username}".`);
  }

  const { contributionCalendar } = res.data.data.user.contributionsCollection;
  const createdAt = res.data.data.user.createdAt;

  // Flatten all weeks → contribution days from the past year.
  /** @type {StreakDay[]} */
  const days = contributionCalendar.weeks.flatMap(
    (/** @type {{ contributionDays: StreakDay[] }} */ week) =>
      week.contributionDays,
  );

  const creationYear = new Date(createdAt).getUTCFullYear();
  const currentYear = new Date().getUTCFullYear();

  let currentFetchedYear = currentYear - 1;
  let allDays = [...days];
  allDays.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  // Determine if the current streak reaches the beginning of our fetched days
  let stats = calculateStreaks(allDays);
  let streakReachesOldestDay = stats.currentStreak.start === allDays[0].date;

  // Sequentially fetch older years if the streak is unbroken at the boundary
  while (streakReachesOldestDay && currentFetchedYear >= creationYear) {
    const yearQuery = buildYearQuery(username, currentFetchedYear);

    const yearRes = await retryer(
      (variables, token) => {
        const resolvedToken = token || process.env.GITHUB_TOKEN || "";
        return request(
          { query: yearQuery, variables },
          { Authorization: `bearer ${resolvedToken}` },
        );
      },
      { login: username },
    );

    if (yearRes.data && yearRes.data.data && yearRes.data.data.user) {
      const collection = yearRes.data.data.user.contributionsCollection;
      if (collection && collection.contributionCalendar) {
        const yearDays = collection.contributionCalendar.weeks.flatMap(
          (/** @type {{ contributionDays: StreakDay[] }} */ week) =>
            week.contributionDays,
        );
        allDays.push(...yearDays);
      }
    } else {
      break; // Stop if there's an error fetching this year
    }

    // Deduplicate and sort days
    const uniqueDaysMap = new Map();
    for (const day of allDays) {
      uniqueDaysMap.set(day.date, day);
    }
    allDays = Array.from(uniqueDaysMap.values());
    allDays.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    stats = calculateStreaks(allDays);

    // Check if streak still reaches the oldest day of the newly expanded data
    if (stats.currentStreak.start !== allDays[0].date) {
      break; // Streak broke in this year, no need to fetch older years
    }

    currentFetchedYear--;
  }

  let totalContributions = 0;
  for (const day of allDays) {
    totalContributions += day.contributionCount;
  }

  return {
    totalContributions,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    firstContribution: stats.firstContribution,
  };
};

export { fetchStreak };
export default fetchStreak;

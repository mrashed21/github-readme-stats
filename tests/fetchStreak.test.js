// @ts-check

/**
 * Tests for GitHub streak calculation logic.
 *
 * Covers all 6 required cases:
 *   CASE 1 – 5 consecutive active days
 *   CASE 2 – 5 active + 1 inactive + 3 active
 *   CASE 3 – 365 days with only 55 consecutive active
 *   CASE 4 – No contribution today, contribution yesterday
 *   CASE 5 – No contributions
 *   CASE 6 – Single contribution day
 */

import { jest } from "@jest/globals";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a flat array of StreakDay objects.
 *
 * @param {Array<{ date: string; count: number }>} entries Array of date/count pairs.
 * @returns {Array<{ date: string; contributionCount: number }>} Mapped contribution day objects.
 */
const makeDays = (entries) =>
  entries.map(({ date, count }) => ({
    date,
    contributionCount: count,
  }));

/**
 * Generates a sequence of consecutive calendar date strings (YYYY-MM-DD)
 * starting from `startDate` for `n` days.
 *
 * Uses pure UTC arithmetic to stay timezone-agnostic.
 *
 * @param {string} startDate YYYY-MM-DD start date.
 * @param {number} n Number of days to generate.
 * @returns {string[]} Array of YYYY-MM-DD date strings.
 */
const dateRange = (startDate, n) => {
  const [y, m, d] = startDate.split("-").map(Number);
  const results = [];
  // Use UTC noon to avoid any DST/midnight edge cases during date arithmetic
  const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  for (let i = 0; i < n; i++) {
    const cur = new Date(base.getTime() + i * 86_400_000);
    const yy = cur.getUTCFullYear();
    const mm = String(cur.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(cur.getUTCDate()).padStart(2, "0");
    results.push(`${yy}-${mm}-${dd}`);
  }
  return results;
};

/**
 * Returns today's date as YYYY-MM-DD (UTC).
 * @returns {string} Today's date string in YYYY-MM-DD format.
 */
const todayStr = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

/**
 * Returns yesterday's date as YYYY-MM-DD (UTC).
 * @returns {string} Yesterday's date string in YYYY-MM-DD format.
 */
const yesterdayStr = () => {
  const d = new Date(Date.now() - 86_400_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

/**
 * Returns tomorrow's date as YYYY-MM-DD (UTC).
 * @returns {string} Tomorrow's date string in YYYY-MM-DD format.
 */
const tomorrowStr = () => {
  const d = new Date(Date.now() + 86_400_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

/**
 * Returns the UTC date n days before today as YYYY-MM-DD.
 * @param {number} n Number of days before today.
 * @returns {string} Date string in YYYY-MM-DD format.
 */
const daysAgo = (n) => {
  const d = new Date(Date.now() - n * 86_400_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Builds a mock GitHub API response
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a mock GitHub API response object for use with retryer mock.
 *
 * @param {Array<{ date: string; contributionCount: number }>} days Contribution day objects.
 * @param {number} total Total contribution count.
 * @returns {object} Mock axios-style response object.
 */
const buildMockResponse = (days, total = 0) => ({
  data: {
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: total,
            weeks: [{ contributionDays: days }],
          },
        },
      },
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Mock the retryer
// ─────────────────────────────────────────────────────────────────────────────

jest.unstable_mockModule("../src/common/retryer.js", () => ({
  retryer: jest.fn(),
  RETRIES: 0,
}));

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("fetchStreak – streak calculation", () => {
  let fetchStreak;
  let retryer;

  beforeAll(async () => {
    const retryerModule = await import("../src/common/retryer.js");
    retryer = retryerModule.retryer;
    const streakModule = await import("../src/fetchers/streak.js");
    fetchStreak = streakModule.fetchStreak;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── CASE 1 ────────────────────────────────────────────────────────────────
  it("CASE 1: 5 consecutive active days ending today → currentStreak = 5", async () => {
    const allDates = dateRange(daysAgo(4), 5); // days[-4 .. today]
    const days = makeDays(allDates.map((d) => ({ date: d, count: 3 })));
    retryer.mockResolvedValueOnce(buildMockResponse(days, 15));

    const result = await fetchStreak("testuser");

    expect(result.currentStreak.length).toBe(5);
    expect(result.longestStreak.length).toBe(5);
  });

  // ── CASE 2 ────────────────────────────────────────────────────────────────
  it("CASE 2: 5 active + 1 inactive + 3 active (ending today) → longestStreak=5, currentStreak=3", async () => {
    const firstFive = dateRange(daysAgo(8), 5); // oldest
    const gapDay = daysAgo(3);
    const lastThree = dateRange(daysAgo(2), 3); // ending today

    const days = makeDays([
      ...firstFive.map((d) => ({ date: d, count: 2 })),
      { date: gapDay, count: 0 },
      ...lastThree.map((d) => ({ date: d, count: 1 })),
    ]);
    retryer.mockResolvedValueOnce(buildMockResponse(days, 18));

    const result = await fetchStreak("testuser");

    expect(result.currentStreak.length).toBe(3);
    expect(result.longestStreak.length).toBe(5);
  });

  // ── CASE 3 ────────────────────────────────────────────────────────────────
  it("CASE 3: 365 days, only 55 consecutive active at end → currentStreak=55, longestStreak=55", async () => {
    const inactiveDates = dateRange(daysAgo(364), 310); // 310 inactive
    const activeDates = dateRange(daysAgo(54), 55); // 55 active ending today

    const days = makeDays([
      ...inactiveDates.map((d) => ({ date: d, count: 0 })),
      ...activeDates.map((d) => ({ date: d, count: 5 })),
    ]);
    retryer.mockResolvedValueOnce(buildMockResponse(days, 55 * 5));

    const result = await fetchStreak("testuser");

    expect(result.currentStreak.length).toBe(55);
    expect(result.longestStreak.length).toBe(55);
  });

  // ── CASE 4 ────────────────────────────────────────────────────────────────
  it("CASE 4: No contribution today, contribution yesterday → grace day keeps streak alive", async () => {
    const yesterday = yesterdayStr();
    // 5 active days ending yesterday, then today = 0
    const activeDates = dateRange(daysAgo(5), 5); // ends yesterday
    const days = makeDays([
      ...activeDates.map((d) => ({ date: d, count: 3 })),
      { date: todayStr(), count: 0 },
    ]);
    retryer.mockResolvedValueOnce(buildMockResponse(days, 15));

    const result = await fetchStreak("testuser");

    // Grace day: today has 0 contributions, but yesterday's streak still counts
    expect(result.currentStreak.length).toBeGreaterThanOrEqual(1);
    expect(result.currentStreak.end).toBe(yesterday);
  });

  // ── CASE 5 ────────────────────────────────────────────────────────────────
  it("CASE 5: No contributions → currentStreak=0, longestStreak=0", async () => {
    const allDates = dateRange(daysAgo(9), 10);
    const days = makeDays(allDates.map((d) => ({ date: d, count: 0 })));
    retryer.mockResolvedValueOnce(buildMockResponse(days, 0));

    const result = await fetchStreak("testuser");

    expect(result.currentStreak.length).toBe(0);
    expect(result.longestStreak.length).toBe(0);
    expect(result.totalContributions).toBe(0);
    expect(result.firstContribution).toBeNull();
  });

  // ── CASE 6 ────────────────────────────────────────────────────────────────
  it("CASE 6: Single contribution day (today) → currentStreak=1, longestStreak=1", async () => {
    const today = todayStr();
    const days = makeDays([{ date: today, count: 7 }]);
    retryer.mockResolvedValueOnce(buildMockResponse(days, 7));

    const result = await fetchStreak("testuser");

    expect(result.currentStreak.length).toBe(1);
    expect(result.longestStreak.length).toBe(1);
    expect(result.firstContribution).toBe(today);
  });

  // ── EXTRA: totalContributions comes from API, not day-count ───────────────
  it("totalContributions comes from contributionCalendar.totalContributions", async () => {
    const today = todayStr();
    const days = makeDays([{ date: today, count: 4255 }]);
    retryer.mockResolvedValueOnce(buildMockResponse(days, 4255));

    const result = await fetchStreak("testuser");

    expect(result.totalContributions).toBe(4255);
    expect(result.currentStreak.length).toBe(1); // only 1 day
  });

  // ── EXTRA: inactive days never count toward streak ────────────────────────
  it("inactive days (contributionCount=0) are NEVER counted toward streak", async () => {
    // Alternating active/inactive: longestStreak should be 1
    const dates = dateRange(daysAgo(9), 10);
    const days = makeDays(
      dates.map((d, i) => ({ date: d, count: i % 2 === 0 ? 1 : 0 })),
    );
    retryer.mockResolvedValueOnce(buildMockResponse(days, 5));

    const result = await fetchStreak("testuser");

    expect(result.longestStreak.length).toBe(1);
  });

  // ── EXTRA: future dates are skipped ──────────────────────────────────────
  it("future dates are skipped in current streak calculation", async () => {
    const today = todayStr();
    const tomorrow = tomorrowStr();
    const days = makeDays([
      { date: today, count: 3 },
      { date: tomorrow, count: 5 }, // future — must be ignored
    ]);
    retryer.mockResolvedValueOnce(buildMockResponse(days, 8));

    const result = await fetchStreak("testuser");

    // streak = 1 (only today), NOT 2
    expect(result.currentStreak.length).toBe(1);
  });

  // ── EXTRA: month-boundary date sort is correct ────────────────────────────
  it("date comparison is calendar-day safe across month boundaries", async () => {
    // Jan 30 → Jan 31 → Feb 01 (3 active), Feb 02 (inactive)
    const days = makeDays([
      { date: "2026-01-30", count: 1 },
      { date: "2026-01-31", count: 1 },
      { date: "2026-02-01", count: 1 },
      { date: "2026-02-02", count: 0 },
    ]);
    retryer.mockResolvedValueOnce(buildMockResponse(days, 3));

    const result = await fetchStreak("testuser");

    expect(result.longestStreak.length).toBe(3);
  });
});

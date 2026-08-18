// @ts-check

import { renderStreakCard } from "../src/cards/streak.js";
import { guardAccess } from "../src/common/access.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
  setErrorCacheHeaders,
} from "../src/common/cache.js";
import {
  MissingParamError,
  retrieveSecondaryMessage,
} from "../src/common/error.js";
import { parseBoolean } from "../src/common/ops.js";
import { renderError } from "../src/common/render.js";
import { fetchStreak } from "../src/fetchers/streak.js";

// @ts-ignore
export default async (req, res) => {
  const {
    user,
    theme,
    background,
    stroke,
    ring,
    fire,
    currStreakLabel,
    sideLabels,
    dates,
    hide_border,
    border_radius,
    cache_seconds,
  } = req.query;

  res.setHeader("Content-Type", "image/svg+xml");

  /** @type {{ title_color?: string, text_color?: string, bg_color?: string, border_color?: string, theme?: string }} */
  const colors = { theme };

  // Guard whitelist/blacklist using the username
  const access = guardAccess({
    res,
    id: user,
    type: "username",
    colors,
  });
  if (!access.isPassed) {
    return access.result;
  }

  try {
    const streakData = await fetchStreak(user);

    // Use the STATS_CARD TTL range — streak data changes at most once per day
    const cacheSeconds = resolveCacheSeconds({
      requested: parseInt(cache_seconds, 10),
      def: CACHE_TTL.STATS_CARD.DEFAULT,
      min: CACHE_TTL.STATS_CARD.MIN,
      max: CACHE_TTL.STATS_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    return res.send(
      renderStreakCard(streakData, {
        theme,
        background,
        stroke,
        ring,
        fire,
        currStreakLabel,
        sideLabels,
        dates,
        hide_border: parseBoolean(hide_border),
        border_radius,
      }),
    );
  } catch (err) {
    setErrorCacheHeaders(res);
    if (err instanceof Error) {
      return res.send(
        renderError({
          message: err.message,
          secondaryMessage: retrieveSecondaryMessage(err),
          renderOptions: {
            ...colors,
            show_repo_link: !(err instanceof MissingParamError),
          },
        }),
      );
    }
    return res.send(
      renderError({
        message: "An unknown error occurred",
        renderOptions: colors,
      }),
    );
  }
};

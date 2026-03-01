const axios = require("axios");
const xml2js = require("xml2js");

// Parse RSS feed
async function getWatchlistRSS(username) {
  try {
    const url = `https://letterboxd.com/${username}/watchlist/rss/`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const parser = new xml2js.Parser();
    const parsed = await parser.parseStringPromise(response.data);

    const items = parsed.rss.channel[0].item || [];

    // Map to title + poster (RSS feed includes poster URL)
    const films = items.map(item => ({
      title: item.title[0],
      poster: item["media:thumbnail"]
        ? item["media:thumbnail"][0].$.url
        : null
    }));

    return films;

  } catch (e) {
    return [];
  }
}

// JustWatch streaming lookup
async function getStreaming(title, country) {
  try {
    const res = await axios.post(
      `https://apis.justwatch.com/content/titles/${country}/popular`,
      { query: title, page_size: 1 }
    );

    if (!res.data.items.length) return [];

    const offers = res.data.items[0].offers || [];
    return [...new Set(offers.map(o => o.package_short_name))];

  } catch {
    return [];
  }
}

// Main API handler
module.exports = async (req, res) => {
  const username = req.query.username;
  const country = req.query.country || "US";

  if (!username) {
    res.status(400).json({ error: "Missing username" });
    return;
  }

  const films = await getWatchlistRSS(username);

  if (!films.length) {
    res.json({ error: "Username not found or watchlist empty / private" });
    return;
  }

  const results = {};

  // Fetch streaming info in parallel for speed
  await Promise.all(
    films.map(async film => {
      const services = await getStreaming(film.title, country);
      const service = services[0] || "Not Streaming";

      if (!results[service]) results[service] = [];
      results[service].push(film);
    })
  );

  res.json(results);
};

const axios = require("axios");
const cheerio = require("cheerio");

async function pinterest(query) {
  const searchUrl = `https://www.google.com/search?q=site:pinterest.com+${encodeURIComponent(query)}&tbm=isch`;
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  };

  try {
    const res = await axios.get(searchUrl, { headers });
    const $ = cheerio.load(res.data);
    const results = [];

    $('img').each((i, el) => {
      const imgUrl = $(el).attr('src') || $(el).attr('data-src');
      if (imgUrl && imgUrl.startsWith('http')) {
        results.push({
          image: imgUrl,
          caption: query,
          source: searchUrl,
          upload_by: "Pinterest Scraper (Google)"
        });
      }
    });

    return results.slice(0, 5);
  } catch (err) {
    console.error("Pinterest Scraper Error:", err.message);
    throw new Error("Gagal scrap gambar.");
  }
}

module.exports = { pinterest };

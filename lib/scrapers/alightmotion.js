const axios = require('axios');
const cheerio = require('cheerio');

async function alightScrape(url) {
  try {
    const res = await fetch(`https://api.siputzx.my.id/api/download/presetam?url=${encodeURIComponent(url)}`);
    const json = await res.json();

    if (!json || !json.status || !json.result) {
      return { error: 'API gagal mengembalikan data yang valid.' };
    }

    return {
      title: json.result.title,
      description: json.result.description
    };
  } catch (e) {
    console.error("alightScrape error:", e.message);
    return { error: 'Gagal mengambil preset, coba lagi.' };
  }
}

  
    

require('dotenv').config();

const { Telegraf } = require('telegraf');

const axios = require('axios');

const { ImageUploadService } = require('node-upload-images');

const fs = require("fs") ;

const path = require("path") ;

const userUploadPixhost = new Map();

const archiver = require("archiver") ;

const { URL } = require('url');

const TelegramBot = require('node-telegram-bot-api');

const bot = new Telegraf(process.env.BOT_TOKEN);

const chalk = require('chalk');

const util = require('util');

const { remini } = require('./lib/remini');

const { pinterest } = require('./lib/scrapers/pinterest');

const { tiktokDownloaderVideo } = require('./lib/scrapers/tiktok');

const mediaFire = require("./lib/mediafire");

const Kusonime = require('./lib/scrapers/kusonime');

function escapeMarkdown(text) {

  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');

}

bot.start((ctx) => {

  ctx.reply('Halo ' + ctx.from.first_name + '! Gunakan /menu untuk melihat fitur.');

});

bot.command("menu", (ctx) => {

  const text = "💬 *MENU BOT*\n\n" +

        

    "- /tiktok [url]\n" +

    "- /anime [judul]\n" +

    "- /film [judul]\n" +

    "- /gpt [tanya]\n" +


    "- /toqr [teks]\n " +


    "- /tourl [gambar]\n " +


    "- /logogen\n " +


    "- /ssweb [url]\n " +


    "- /get [url]\n" +

    "- /cweb\n " +


    "- /dellweb\n " +


    "- /listweb\n " +


    "- /getfile [url]\n " + 

    "- /pinterest [query]";

  ctx.reply(text, { parse_mode: "Markdown" });

});
 
bot.command("tourl", async (ctx) => {
  const reply = ctx.message.reply_to_message;

  if (!reply || !reply.photo) {
    return ctx.reply("❌ Gunakan perintah ini dengan *membalas gambar* yang ingin diubah jadi link.", { parse_mode: "MarkdownV2" });
  }

  try {
    const photoArray = reply.photo;
    const photo = photoArray[photoArray.length - 1]; 
      
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);


    const headResp = await axios.head(fileLink.href);
    const contentType = headResp.headers["content-type"];
    if (contentType !== "image/jpg") {
      return ctx.reply("⚠️ Gagal: Bot hanya menerima gambar *berformat JPG* (bukan WebP/PNG).", { parse_mode: "Markdown" });
    }

    const filename = `${ctx.chat.id}_${Date.now()}.jpg`;
    const filePath = path.join(__dirname, filename);

    const response = await axios.get(fileLink.href, { responseType: "stream" });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const service = new ImageUploadService("pixhost.to");
    const buffer = fs.readFileSync(filePath);
    const { directLink } = await service.uploadFromBinary(buffer, "upload.jpg");

    await ctx.reply(`✅ *Berhasil diunggah!*\n\n🔗 Link: ${directLink}`, {
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    });

    fs.unlinkSync(filePath);
      
  } catch (err) {
    console.error("Upload Error:", err);
    await ctx.reply("❌ Gagal mengunggah gambar. Coba lagi atau pastikan format JPG.");
  }
});

bot.command("logogen", async (ctx) => {

  const input = ctx.message.text.split(" ").slice(1).join(" ");

  if (!input) {

    return ctx.reply("⚠️ Masukkan judul, ide, dan slogan logo.\n\nFormat: `/logogen Judul|Ide|Slogan`\nContoh: `/logogen Takashi|imul impul|Jangan lupa follow yah`", { parse_mode: "Markdown" });

  }

  const [title, idea, slogan] = input.split("|");

  if (!title || !idea || !slogan) {

    return ctx.reply("❌ Format salah.\nGunakan: `/logogen Judul|Ide|Slogan`\n\nContoh: `/logogen Takashi|Desain Anime|Kualitas Premium`", { parse_mode: "Markdown" });

  }

  try {

    const payload = {

      ai_icon: [333276, 333279],

      height: 300,

      idea: idea,

      industry_index: "N",

      industry_index_id: "",

      pagesize: 4,

      session_id: "",

      slogan: slogan,

      title: title,

      whiteEdge: 80,

      width: 400

    };

    const { data } = await axios.post("https://www.sologo.ai/v1/api/logo/logo_generate", payload);

    if (!data.data.logoList || data.data.logoList.length === 0) {

      return ctx.reply("❌ Gagal membuat logo. Coba ide/slogan lain.");

    }

    const logoUrls = data.data.logoList.map(logo => logo.logo_thumb);

    for (const url of logoUrls) {

      await ctx.replyWithPhoto({ url });

    }

  } catch (error) {

    console.error("Error generating logo:", error.message);

    ctx.reply("❌ Terjadi kesalahan saat membuat logo. Coba lagi nanti.");

  }

});

bot.command("toqr", async (ctx) => {

  const input = ctx.message.text.split(" ").slice(1).join(" ");

  if (!input) {

    return ctx.reply("⚠️ Text nya mana?\n\nContoh:\n/txt2qr Halo Dunia");

  }

  const urlQR = `https://api.siputzx.my.id/api/tools/text2qr?text=${encodeURIComponent(input)}`;

  try {

    await ctx.replyWithPhoto({ url: urlQR }, { caption: "🗳️ Success Convert To QR" });

  } catch (err) {

    console.error("Gagal kirim QR:", err);

    ctx.reply("❌ Gagal membuat QR. Coba lagi nanti.");

  }

});

bot.command("ssweb", async (ctx) => {

  try {

    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();

    if (!input) {

      return ctx.reply("⚠️ Harap masukkan URL website yang ingin di-screenshot!\n*Contoh:* /ssweb https://example.com", { parse_mode: "Markdown" });

    }

    let url = input;

    if (!/^https?:\/\//i.test(url)) {

      url = "https://" + url;

    }

    const screenshotUrl = `https://api.siputzx.my.id/api/tools/ssweb?url=${encodeURIComponent(url)}&theme=light&device=desktop`;

    await ctx.replyWithPhoto(

      { url: screenshotUrl },

      {

        caption: `📸 *Screenshot Website*\n🌐 *URL:* ${url}\n🖥️ *Mode:* Desktop\n☀️ *Tema:* Light`,

        parse_mode: "Markdown"

      }

    );

  } catch (error) {

    console.error("❌ Error ssweb:", error);

    ctx.reply("⚠️ Gagal mengambil screenshot. Coba lagi nanti.");

  }

});

function escapeMarkdown(text) {

  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');

}
bot.command(["getfile"], async (ctx) => {

  const url = ctx.message.text.split(" ").slice(1).join(" ");

  if (!url || !url.startsWith("http")) return ctx.reply("⚠️ Masukkan URL valid.");

  try {

    const res = await axios.get(url, {

      responseType: "arraybuffer", 

      

      headers: { 'User-Agent': 'Mozilla/5.0' } 

      

    });

    const urlObj = new URL(url);

    let fileName = path.basename(urlObj.pathname);

    if (!fileName || !fileName.includes(".")) fileName = "file.html";

    const filePath = path.join(__dirname, fileName);

    fs.writeFileSync(filePath, res.data);

    await ctx.replyWithDocument({ source: filePath, filename: fileName });

    fs.unlinkSync(filePath);

    

  } catch (e) {

    console.error(e.message);

    ctx.reply("❌ Gagal mengunduh atau mengirim file.");

  }

});

bot.command('tiktok', async (ctx) => {

  const text = ctx.message.text.split(" ").slice(1).join(" ");

  if (!text) return ctx.reply("⚠️ Kirim link TikTok.\nContoh: /tiktok https://vm.tiktok.com/...");

  try {

    await ctx.reply("⏱️ Mengambil video...");

    const anu = await tiktokDownloaderVideo(text);

    console.log(JSON.stringify(anu, null, 2));

    if (!anu.data || !Array.isArray(anu.data) || anu.data.length === 0) {

      return ctx.reply("⚠️ Tidak menemukan media di link tersebut.");

    }

    for (let imgs of anu.data) {

      const caption = `${anu.title || 'No Caption'}\n📍 Region: ${anu.region}\n📅 Taken: ${anu.taken_at}`;

      if (imgs.type === "nowatermark") {

        await ctx.replyWithVideo({ url: imgs.url }, { caption });

      } else if (imgs.type === "photo") {

        await ctx.replyWithPhoto({ url: imgs.url }, { caption });

      } else {

        await ctx.reply("⚠️ Jenis media tidak dikenal.");

      }

    }

  } catch (err) {

    console.error("TikTok error:", err);

    ctx.reply("⚠️ Gagal mengambil video TikTok.");

  }

});

  

 bot.command('anime', async (ctx) => {

  const text = ctx.message.text.split(" ").slice(1).join(" ");

  if (!text) return ctx.reply("⚠️ Masukkan judul anime.");

  try {

    const results = await Kusonime.search(text);

    if (typeof results === 'string') return ctx.reply("⚠️ " + results);

    let msg = "🔍 Hasil Pencarian: " + text + "\n\n";

    results.slice(0, 5).forEach((anime, i) => {

      msg += "📺 *" + (i + 1) + ". " + anime.title + "*\n";

      msg += "🔗 " + anime.url + "\n";

      msg += "📅 Rilis: " + anime.releaseTime + "\n";

      msg += "🗂️ Genre: " + anime.genres.join(', ') + "\n\n";

    });

    ctx.reply(msg, { parse_mode: "Markdown" });

  } catch (e) {

    ctx.reply("⚠️ Gagal mencari anime.");

  }

});


bot.command("film", async (ctx) => {

  const query = ctx.message.text.split(" ").slice(1).join(" ");

  if (!query) return ctx.reply("Ketik judul film. Contoh: /film Inception");

  try {

    const res = await axios.get(`http://www.omdbapi.com/?apikey=742b2d09&t=${encodeURIComponent(query)}`);

    if (res.data.Response === "False") return ctx.reply("Film tidak ditemukan!");

    const d = res.data;

    const caption = "🎬 *" + d.Title + " (" + d.Year + ")*\n" +

      "⭐ " + d.imdbRating + "/10\n" +

      "🕒 " + d.Runtime + "\n" +

      "🌍 " + d.Country + "\n" +

      "📃 " + d.Plot;

    ctx.replyWithPhoto({ url: d.Poster }, { caption, parse_mode: 'Markdown' });

  } catch (e) {

    ctx.reply("Error IMDb: " + e.message);

  }

});

bot.command("gpt", async (ctx) => {

  const text = ctx.message.text.split(" ").slice(1).join(" ");

  if (!text) return ctx.reply("Contoh: /gpt tanyakan sesuatu");

  try {

    const res = await axios.get(`https://api.siputzx.my.id/api/ai/gpt3?prompt=Kamu adalah AI cerdas&content=${encodeURIComponent(text)}`);

    const reply = res.data.result || res.data.data || "Tidak ada respon.";

    ctx.reply(reply);

  } catch (e) {

    ctx.reply("❌ Gagal mendapatkan jawaban.");

  }

});

bot.command(["pih", "get"], async (ctx) => {

  const url = ctx.message.text.split(" ").slice(1).join(" ");

  if (!url || !url.startsWith("http")) return ctx.reply("⚠️ Masukkan URL valid.");

  try {

    const res = await axios.get(url);

    const html = escapeMarkdown(util.format(res.data)).slice(0, 3000);

    ctx.reply("✅ HTML Preview:\n```\n" + html + "\n```", { parse_mode: "MarkdownV2" });

  } catch (e) {

    ctx.reply("❌ Gagal mengambil data dari URL.");

  }

});

bot.command(["pinterest", "pin"], async (ctx) => {

  const text = ctx.message.text.split(" ").slice(1).join(" ");

  if (!text) return ctx.reply("⚠️ Masukkan kata kunci. Contoh: /pinterest aesthetic cat");

  try {

    const result = await pinterest(text);

    for (let i = 0; i < result.length && i < 5; i++) {

      const item = result[i];

      const caption = "📷 Gambar " + (i + 1) + "\n" +

        "👤 " + item.upload_by + "\n" +

        "📝 " + item.caption + "\n" +

        "🔗 " + item.source;

      await ctx.replyWithPhoto({ url: item.image }, {

        caption: escapeMarkdown(caption),

        parse_mode: "MarkdownV2",

        reply_markup: {

          inline_keyboard: [[{ text: "🌐 Source", url: item.source }]]

        }

      });

    }

  } catch (err) {

    ctx.reply("❌ Gagal mengambil gambar.");

  }

});

bot.launch().then(() => {

  console.log(chalk.green("🤖 Bot Telegram aktif sepenuhnya..."));

});

process.once('SIGINT', () => bot.stop('SIGINT'));

process.once('SIGTERM', () => bot.stop('SIGTERM'));

const unzipper = require('unzipper');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

bot.command('cweb', async (ctx) => {

  const text = ctx.message.text.split(" ").slice(1).join(" ");

  const userId = ctx.from.id;

  const isCreator = (id) => true; 

  const isSellerWeb = (id) => true;

  if (!isCreator(userId) && !isSellerWeb(userId)) return ctx.reply('Fitur Khusus Reseller Website');

  if (!text) return ctx.reply('Penggunaan: /createweb (reply file zip/html atau kirim kode html langsung)');

  const replied = ctx.message.reply_to_message;

  const webName = text.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');

  const domainCheckUrl = `https://${webName}.vercel.app`;

  try {

    const check = await fetch(domainCheckUrl);

    if (check.status === 200) return ctx.reply(`❌ Nama web *${webName}* sudah digunakan.`);

  } catch (e) {

  }

  await ctx.reply('⏳ Upload ke Vercel...');

  const filesToUpload = [];

  if (replied && replied.document) {

    const fileInfo = replied.document;

    const fileMime = fileInfo.mime_type || '';

    const fileName = fileInfo.file_name || '';

    const isZip = fileMime.includes('zip') || fileName.endsWith('.zip');

    const isHtml = fileMime.includes('html') || fileName.endsWith('.html');

    if (!isZip && !isHtml) return ctx.reply('File tidak dikenali. Kirim file .zip atau .html');

    const link = await ctx.telegram.getFileLink(fileInfo.file_id);

    const fileBuffer = await (await fetch(link.href)).buffer();

    if (isZip) {

      const directory = await unzipper.Open.buffer(fileBuffer);

      for (const file of directory.files) {

        if (file.type === 'File') {

          const content = await file.buffer();

          const filePath = file.path.replace(/^\/+/, '').replace(/\\/g, '/');

          filesToUpload.push({

            file: filePath,

            data: content.toString('base64'),

            encoding: 'base64'

          });

        }

      }

      if (!filesToUpload.some(x => x.file.toLowerCase().endsWith('index.html'))) {

        return ctx.reply('❌ File index.html tidak ditemukan.');

      }

    } else if (isHtml) {

      filesToUpload.push({

        file: 'index.html',

        data: fileBuffer.toString('base64'),

        encoding: 'base64'

      });

    }

  } else if (replied && replied.text && replied.text.includes('<html')) {

    filesToUpload.push({

      file: 'index.html',

      data: Buffer.from(replied.text).toString('base64'),

      encoding: 'base64'

    });

  } else {

    return ctx.reply('Reply file .zip/.html atau kirim kode HTML langsung.');

  }

  const headers = {

    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,

    'Content-Type': 'application/json'

  };

  await fetch('https://api.vercel.com/v9/projects', {

    method: 'POST',

    headers,

    body: JSON.stringify({ name: webName })

  }).catch(() => {});

  const deployRes = await fetch('https://api.vercel.com/v13/deployments', {

    method: 'POST',

    headers,

    body: JSON.stringify({

      name: webName,

      project: webName,

      files: filesToUpload,

      projectSettings: { framework: null }

    })

  });

  const deployData = await deployRes.json();

  if (!deployData || !deployData.url) {

    return ctx.reply(`❌ Gagal deploy: ${JSON.stringify(deployData)}`);

  }

  ctx.reply(`✅ Website berhasil dibuat!\n🌐 https://${webName}.vercel.app`);

});

bot.command('dellweb', async (ctx) => {

  const text = ctx.message.text.split(" ").slice(1).join(" ").trim().toLowerCase();

  const userId = ctx.from.id;

  const isCreator = (id) => true;

  const isSellerWeb = (id) => true;

  if (!isCreator(userId) && !isSellerWeb(userId)) return ctx.reply('Fitur Khusus Reseller Website');

  if (!text) return ctx.reply('Penggunaan: /deleteweb <nama_project>');

  const headers = {

    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,

    'Content-Type': 'application/json'

  };

  try {

    const res = await fetch(`https://api.vercel.com/v9/projects/${text}`, {

      method: 'DELETE',

      headers

    });

    if (res.status === Project) {

      ctx.reply(`✅ Project *${text}* berhasil dihapus.`, { parse_mode: "Markdown" });

    } else {

      const data = await res.json();

      ctx.reply(`❌ Gagal menghapus: ${data.error?.message || 'Unknown error'}`);

    }

  } catch (err) {

    console.error('Delete error:', err);

    ctx.reply("✅ Project berhasil dihapus");

  }

});

bot.command('listweb', async (ctx) => {

  const userId = ctx.from.id;

  const isCreator = (id) => true;

  const isSellerWeb = (id) => true;

  if (!isCreator(userId) && !isSellerWeb(userId)) return ctx.reply('Fitur Khusus Reseller Website');

  const headers = {

    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,

    'Content-Type': 'application/json'

  };

  try {

    const res = await fetch(`https://api.vercel.com/v9/projects`, { headers });

    const data = await res.json();

    if (!Array.isArray(data.projects)) return ctx.reply("❌ Tidak dapat mengambil data.");

    const list = data.projects.map(p => `🔹 ${p.name} → https://${p.name}.vercel.app`).join("\n");

    ctx.reply(`📄 Daftar Website:

${list || 'Belum ada project.'}`);

  } catch (e) {

    ctx.reply("❌ Gagal mengambil daftar project.");

  }

});


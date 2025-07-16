// lib/mediafire.js

const cheerio = require("cheerio");
const { fetch } = require("undici");
const { lookup } = require("mime-types");

async function mediaFire(url) {
	try {
		const res = await fetch(url);
		const html = await res.text();
		const $ = cheerio.load(html);

		// Cari tombol download
		const downloadBtn = $("#downloadButton");
		const download = downloadBtn.attr("href");

		if (!download) throw new Error("Link download tidak ditemukan");

		// Nama file
		const filenameAttr = downloadBtn.attr("aria-label");
		const filename = filenameAttr
			? filenameAttr.replace("Download file ", "").trim()
			: decodeURIComponent(download.split("/").pop());

		// Ekstensi & MIME
		const ext = filename.split(".").pop();
		const mimetype = lookup(ext) || "application/octet-stream";

		// Ukuran
		const sizeText = $(".fileInfo").text();
		const sizeMatch = sizeText.match(/(?:Size|Ukuran):\s*([0-9.]+\s*[A-Z]{2})/i);
		const size = sizeMatch ? sizeMatch[1] : "Tidak diketahui";

		return { filename, size, ext, mimetype, download };
	} catch (err) {
		throw {
			msg: "Gagal mengambil data dari link tersebut",
			error: err.message,
		};
	}
}

module.exports = mediaFire;

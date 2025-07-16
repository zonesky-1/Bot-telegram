const axios = require('axios');

async function remini(buffer, method = "enhance") {
  try {
    const res = await axios({
      method: "post",
      url: "https://api.siputzx.my.id/api/tools/remini",
      data: {
        method,
        image: buffer.toString("base64")
      }
    });

    if (!res.data || !res.data.status || !res.data.result) {
      throw new Error("Gagal memproses gambar");
    }

    const result = await axios.get(res.data.result, { responseType: "arraybuffer" });
    return Buffer.from(result.data);
  } catch (err) {
    console.error("Remini error:", err.message);
    return null;
  }
}

module.exports = { remini };

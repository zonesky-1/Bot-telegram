module.exports = function (bot) {
  bot.command("tourl", async (ctx) => {
    const pushname = ctx.from.first_name || "User";

    const captionText = `Halo Kak ${pushname}! 🎉\n\nSaat ini, hanya server *8030* yang aktif untuk mengunggah gambar.\n\nPilih server *8030* untuk mengunggah gambar Kamu. Pilih salah satu opsi di bawah ini ya! 🌟`;

    await ctx.reply(captionText, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Catbox 🐱", callback_data: "uploadcatbox" },
            { text: "8030 🎞️", callback_data: "uploadfile" },
          ],
          [
            { text: "Telegraph 🌐", callback_data: "uploadtelegraph" },
            { text: "Pomf 🔥", callback_data: "uploadpomf" },
          ],
          [
            { text: "GitHub 💻", callback_data: "uploadgithub" },
            { text: "ImgBB 🖼️", callback_data: "uploadimgbb" },
          ],
          [
            { text: "TinyURL 🌍", callback_data: "uploadtinyurl" },
          ],
        ],
      },
    });
  });

  bot.on("callback_query", async (ctx) => {
    const cmd = ctx.callbackQuery.data;
    const chatId = ctx.chat.id;

    const responses = {
      uploadcatbox: "🚀 Mengunggah ke server Catbox...",
      uploadfile: "📤 Mengunggah ke server 8030...",
      uploadtelegraph: "🌐 Mengunggah ke server Telegraph...",
      uploadpomf: "🔥 Mengunggah ke server Pomf...",
      uploadgithub: "💻 Mengunggah ke server GitHub...",
      uploadimgbb: "🖼️ Mengunggah ke server ImgBB...",
      uploadtinyurl: "🌍 Mengunggah ke server TinyURL...",
    };

    const response = responses[cmd] || "❌ Opsi tidak dikenali.";
    await ctx.answerCbQuery(); // hapus loading
    await ctx.reply(response);
  });
};

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Fungsi untuk mendownload gambar dan menyimpannya
async function downloadImage(url, path) {
  const writer = fs.createWriteStream(path);

  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream', // Mengatur axios untuk menerima response dalam bentuk stream
    });

    // Menulis gambar ke file
    response.data.pipe(writer);

    // Menunggu hingga file selesai ditulis
    writer.on('finish', () => {
      console.log(`Gambar berhasil disimpan dengan nama ${path}`);
    });

    writer.on('error', (err) => {
      console.error('Terjadi kesalahan saat menyimpan gambar:', err);
    });
  } catch (error) {
    console.error('Terjadi kesalahan saat mendownload gambar:', error);
  }
}

// Fungsi untuk mendownload gambar dan menyimpannya
async function downloadImageX(url, path) {
  const writer = fs.createWriteStream(path + '.jpg');

  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream', // Mengatur axios untuk menerima response dalam bentuk stream
    });

    // Menulis gambar ke file
    response.data.pipe(writer);

    // Menunggu hingga file selesai ditulis
    writer.on('finish', () => {
      console.log(`Gambar berhasil disimpan dengan nama ${path}`);
    });

    writer.on('error', (err) => {
      console.error('Terjadi kesalahan saat menyimpan gambar:', err);
    });
  } catch (error) {
    console.error('Terjadi kesalahan saat mendownload gambar:', error);
  }
}

// Fungsi untuk memodifikasi string
function modifyFilename(filename) {
  // Periksa apakah filename adalah string
  if (typeof filename !== 'string') {
    console.error('Input harus berupa string.');
    return null;
  }

  // Pecah string berdasarkan underscore (_)
  const parts = filename.split('_');

  // Ambil bagian pertama
  const baseName = parts[0];

  // Ambil ekstensi asli dari filename
  const extension = filename.substring(filename.lastIndexOf('.'));

  // Gabungkan baseName dengan ekstensi asli
  const newFilename = baseName + extension;

  return newFilename;
}
module.exports = {
  downloadImage,
  downloadImageX,
  modifyFilename,
};

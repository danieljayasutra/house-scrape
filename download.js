const axios = require('axios');
const fs = require('fs');
const path = require('path');
const url = require('url');
const probe = require('probe-image-size');
const https = require('https');

// Fungsi untuk mendownload gambar dan menyimpannya
async function downloadImage(url, path) {
  try {
    const { width, height } = await getImageSize(url);
    console.log(`Width: ${width}, Height: ${height}`);
    if (width < 400) {
      console.log('Cancel: Lebar gambar kurang dari 500px');
      return;
    }
    if (height < 400) {
      console.log('Cancel: Tinggi gambar kurang dari 500px');
      return;
    }
  } catch (error) {
    console.log('Error probe-image:', error.message);
    return;
  }

  try {
    const writer = fs.createWriteStream(path);
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

async function getImageSize(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, async (res) => {
        try {
          const result = await probe(res);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', reject);
  });
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

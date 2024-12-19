const { JSDOM } = require('jsdom');
const fs = require('fs');

function main() {
  const all = [];
  for (let i = 2; i <= 22; i++) {
    const raw = fs.readFileSync(`document-${i}.html`, 'utf-8');

    const dom = new JSDOM(raw);

    const document = dom.window.document;

    // Mencari tag <a> yang sesuai kriteria
    const links = [...document.querySelectorAll('a')].filter((a) => a.href.includes('/photo/') && a.href.includes('set=g') && a.querySelector('img'));

    // Mengambil nilai href
    const hrefs = links.map((a) => a.href);

    // Menampilkan hasil
    all.push(hrefs.length);
    console.log('LENGTH: ' + hrefs.length);
    console.log(hrefs);
  }

  console.log(all);

  // Menghitung selisih dan memasukkannya ke array baru
  const differences = all.slice(1).map((value, index) => value - all[index]);

  console.log(differences);
}



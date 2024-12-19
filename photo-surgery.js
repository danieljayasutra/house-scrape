const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { downloadImage } = require('./download');
const url = require('url');

async function main() {
  const cookiesPath = path.resolve(__dirname, 'cookies-fb-chrome.json');
  const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
  // Luncurkan browser
  const browser = await puppeteer.launch({
    headless: false, // set ke true jika tidak perlu melihat browser
    defaultViewport: {
      width: 1280, // Lebar jendela
      height: 800, // Tinggi jendela
    },
  });
  const page = await browser.newPage();
  await browser.setCookie(...cookies);

  await page.goto('https://www.facebook.com/photo/?fbid=122167874354108971&set=g.367871819091010', {
    waitUntil: 'networkidle2',
  });
  const html = await page.evaluate(() => document.body.innerHTML);

  fs.writeFileSync('doc-photo.html', html);

  // Tutup browser
  await browser.close();
}

async function main2() {
  const raw = fs.readFileSync(`doc-photo.html`, 'utf-8');

  const dom = new JSDOM(raw);

  const document = dom.window.document;

  const imgElement = document.querySelector('img[data-visualcompletion="media-vc-image"]');

  if (imgElement) {
    const imgSrc = imgElement.src;
    const imageName = path.basename(url.parse(imgSrc).pathname);
    const imagePath = path.join(__dirname + '/img', imageName);

    await downloadImage(imgSrc, imagePath);
  } else {
    console.log('Gambar dengan atribut data-visualcompletion="media-vc-image" tidak ditemukan');
  }
}
main2();

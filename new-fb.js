const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const url = require('url');
const { downloadImage, modifyFilename } = require('./download');
const { randomDelay } = require('./utils');

async function main() {
  const cookiesPath = path.resolve(__dirname, 'cookies-fb-chrome.json');
  const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
  // Luncurkan browser
  const browser = await puppeteer.launch({
    headless: true, // set ke true jika tidak perlu melihat browser
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: {
      width: 1280, // Lebar jendela
      height: 800, // Tinggi jendela
    },
  });
  const page = await browser.newPage();
  await browser.setCookie(...cookies);
  // Buka halaman Facebook
  await page.goto('https://www.facebook.com/groups/367871819091010/media', {
    waitUntil: 'networkidle2',
    timeout: 100000,
  });
  await infiteScroll(page, browser);
  // Tutup browser
  await browser.close();
}
main();

async function infiteScroll(page) {
  let lastDocLength = 0;
  while (true) {
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    // Ambil nilai document.body.scrollHeight
    const scrollHeight = await page.evaluate(() => {
      return document.body.scrollHeight;
    });
    console.log('Scrolling... ', scrollHeight);

    await randomDelay(1000, 3000); // Delay random antara 3-7 detik

    if (scrollHeight > 240000) {
      const html = await page.evaluate(() => document.body.innerHTML);

      const dom = new JSDOM(html);

      const document = dom.window.document;

      // Mencari tag <a> yang sesuai kriteria
      const links = [...document.querySelectorAll('a')].filter(
        (a) => a.href.includes('/photo/') && a.href.includes('set=g') && a.querySelector('img'),
      );

      // Mengambil nilai href
      const hrefs = links.map((a) => a.href);
      lastDocLength = hrefs.length;
      console.log('Last doc length: ', lastDocLength);
      break;
    }
  }

  while (true) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await randomDelay(1000, 4000);

    // Ambil isi DOM dan scroll height untuk validasi
    const html = await page.evaluate(() => document.body.innerHTML);
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log('Height: ', scrollHeight);

    // Cari semua link <a> dengan filter sesuai kriteria
    const hrefs = await page.evaluate(() => {
      return [...document.querySelectorAll('a')]
        .filter((a) => a.href.includes('/photo/') && a.href.includes('set=g') && a.querySelector('img'))
        .map((a) => a.href);
    });

    // Ambil data baru saja (filter berdasarkan lastDocLength jika diperlukan)
    const onlyNewData = hrefs.slice(lastDocLength, hrefs.length);

    // Iterasi melalui link baru untuk memicu klik
    for (const newLink of onlyNewData) {
      await page.evaluate(findAndClickLink, newLink);

      // Tunggu beberapa saat sebelum melanjutkan
      await randomDelay(2000, 5000);

      // Cari elemen gambar
      const imageElement = await page.$('img[data-visualcompletion="media-vc-image"]');

      if (imageElement) {
        // Ambil atribut 'src' dari elemen gambar
        const imageUrl = await page.evaluate((el) => el.src, imageElement);
        const imgSrc = imageUrl;
        const imageName = path.basename(url.parse(imgSrc).pathname);
        const imageNameModified = modifyFilename(imageName);
        const imagePath = path.join(__dirname + '/img', imageNameModified);

        await downloadImage(imgSrc, imagePath);
      } else {
        fs.writeFileSync(`new-doc-photo-no-image.html`, html);
        console.log('Gambar dengan atribut data-visualcompletion="media-vc-image" tidak ditemukan');
      }

      await randomDelay(500, 1000);

      // Tunggu elemen dengan atribut spesifik muncul
      const selector = 'div[aria-label="Close"][role="button"]';
      await page.waitForSelector(selector);

      // Klik elemen
      await page.click(selector);

      await randomDelay(2000, 5000);
    }

    lastDocLength = hrefs.length;
  }
}

// Fungsi untuk mencari dan klik link
async function findAndClickLink(newLink) {
  const link = [...document.querySelectorAll('a')].find((a) => a.href.includes(newLink));
  if (link) {
    // Scroll ke elemen
    link.scrollIntoView();

    // Klik elemen
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    link.dispatchEvent(event);
  }
}
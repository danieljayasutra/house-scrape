const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const url = require('url');
const { downloadImage, modifyFilename } = require('./download');
const { randomDelay, fileExists } = require('./utils');

async function main() {
  const cookiesPath = path.resolve(__dirname, 'cookies-fb-chrome-1.json');
  const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
  // Luncurkan browser
  const browser = await puppeteer.launch({
    headless: false, // set ke true jika tidak perlu melihat browser
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications'],
    defaultViewport: {
      width: 1280, // Lebar jendela
      height: 800, // Tinggi jendela
    },
  });
  const page = await browser.newPage();
  await browser.setCookie(...cookies);
  // Buka halaman Facebook
  // JUAL BELI RUMAH DI BANDUNG
  // https://www.facebook.com/groups/744229732320159/media

  // Rumah Murah surabaya
  // https://www.facebook.com/groups/947230525862360/media

  // Info Jual Beli Rumah Tangerang
  // https://www.facebook.com/groups/620497875014026/media

  await page.goto('https://www.facebook.com/groups/744229732320159/media', {
    waitUntil: 'networkidle2',
    timeout: 100000,
  });
  await infiniteScroll(page, browser);
  // Tutup browser
  await browser.close();
}
main();

async function infiniteScroll(page) {
  let lastDocLength = 0;
  while (true) {
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    // Ambil nilai document.body.scrollHeight
    const scrollHeight = await page.evaluate(() => {
      return document.body.scrollHeight;
    });
    console.log('Scrolling... ', scrollHeight);

    await randomDelay(1000, 1500); // Delay random antara 3-7 detik

    if (scrollHeight > 1) {
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
    await randomDelay(300, 12000);

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
      await randomDelay(300, 1200);

      // Cari elemen gambar
      const imageElement = await page.$('img[data-visualcompletion="media-vc-image"]');

      if (imageElement) {
        // Ambil atribut 'src' dari elemen gambar
        const imageUrl = await page.evaluate((el) => el.src, imageElement);
        const imgSrc = imageUrl;
        const imageName = path.basename(url.parse(imgSrc).pathname);
        const imageNameModified = modifyFilename(imageName);
        const imagePath = path.join(__dirname + '/img', imageNameModified);

        if (fileExists(imagePath)) {
          console.log('File sudah ada: ' + imagePath);
        } else {
          await downloadImage(imgSrc, imagePath);
        }
      } else {
        fs.writeFileSync(`new-doc-photo-no-image.html`, html);
        console.log('Gambar dengan atribut data-visualcompletion="media-vc-image" tidak ditemukan');
      }

      await randomDelay(300, 1200);

      // Tunggu elemen dengan atribut spesifik muncul
      const selector = 'div[aria-label="Close"][role="button"]';
      await page.waitForSelector(selector, { timeout: 60000 });

      // Klik elemen
      await page.click(selector);

      // await randomDelay(300, 1200);
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

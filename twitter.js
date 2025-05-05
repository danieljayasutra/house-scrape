const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const url = require('url');
const { downloadImageX, modifyFilename } = require('./download');
const { randomDelay, fileExists } = require('./utils');

async function main() {
  const cookiesPath = path.resolve(__dirname, 'x-twitter-cookies.json');
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

  await page.goto('https://x.com/HOUSEPORN___/media', {
    waitUntil: 'networkidle2',
    timeout: 100000,
  });
  await infiniteScroll(page, browser);
  // Tutup browser
  await browser.close();
}
main();

async function infiniteScroll(page) {
  const allData = [];
  while (true) {
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    // Ambil nilai document.body.scrollHeight
    const scrollHeight = await page.evaluate(() => {
      return document.body.scrollHeight;
    });
    console.log('Scrolling... ', scrollHeight);

    await randomDelay(3000, 5500); // Delay random antara 3-7 detik

    if (scrollHeight > 1) {
      const html = await page.evaluate(() => document.body.innerHTML);

      const dom = new JSDOM(html);

      const document = dom.window.document;

      // Mencari tag <a> yang sesuai kriteria
      const links = [...document.querySelectorAll('img')].filter((m) => m.src.includes('240x240'));

      // Mengambil nilai href
      const hrefs = links.map((m) => m.src);
      //   lastDocLength = hrefs.length;
      //   console.log('Last doc length: ', lastDocLength);
      //   console.log(hrefs);
      //   break;
      for (const lnk of hrefs) {
        if (!allData.includes(lnk)) {
          allData.push(lnk);
          console.log('Insert & Start download ' + lnk);
          const imgSrc = lnk.replace('240x240', 'medium');
          const imageName = path.basename(url.parse(imgSrc).pathname);
          const imageNameModified = modifyFilename(imageName);
          const imagePath = path.join(__dirname + '/x-img', imageNameModified);

          if (fileExists(imagePath)) {
            console.log('File sudah ada: ' + imagePath);
          } else {
            await downloadImageX(imgSrc, imagePath);
            await randomDelay(500, 1500); // Delay random antara 3-7 detik
          }
        } else {
          console.log('Duplicate ' + lnk);
        }
      }
    }
    console.log('Length: ' + allData.length);
  }
}

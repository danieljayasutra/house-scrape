const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const url = require('url');
const { downloadImage, modifyFilename } = require('./download');
const { timeout } = require('puppeteer');

// Fungsi untuk menunggu dengan delay random
const randomDelay = (min, max) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(`Waiting for ${delay} ms...`);
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// Fungsi untuk scroll

const scrollPage = async (page, browser) => {
  // let previousHeight = await page.evaluate('document.body.scrollHeight');
  let lastDocLength = 0;
  while (true) {
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    // Ambil nilai document.body.scrollHeight
    const scrollHeight = await page.evaluate(() => {
      return document.body.scrollHeight;
    });

    await randomDelay(900, 1200); // Delay random antara 3-7 detik

    console.log(scrollHeight);
    if (scrollHeight > 200000) {
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
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    const html = await page.evaluate(() => document.body.innerHTML);
    const scrollHeight = await page.evaluate(() => {
      return document.body.scrollHeight;
    });
    console.log('Height: ', scrollHeight);

    const dom = new JSDOM(html);

    const document = dom.window.document;

    // Mencari tag <a> yang sesuai kriteria
    const links = [...document.querySelectorAll('a')].filter((a) => a.href.includes('/photo/') && a.href.includes('set=g') && a.querySelector('img'));

    // Mengambil nilai href
    const hrefs = links.map((a) => a.href);

    const onlyNewData = hrefs.slice(lastDocLength, hrefs.length);

    for (const newLink of onlyNewData) {
      const imagePage = await browser.newPage();
      await imagePage.goto('https://www.facebook.com' + newLink, {
        waitUntil: 'networkidle2',
        timeout: 100000,
      });
      const htmlNewPage = await imagePage.evaluate(() => document.body.innerHTML);
      const imageDom = new JSDOM(htmlNewPage);
      const document = imageDom.window.document;

      const imgElement = document.querySelector('img[data-visualcompletion="media-vc-image"]');

      if (imgElement) {
        // const imgSrc = imgElement.src;
        // const imageName = path.basename(url.parse(imgSrc).pathname);
        // const imageNameModified = modifyFilename(imageName);
        // const imagePath = path.join(__dirname + '/img', imageNameModified);
        // await downloadImage(imgSrc, imagePath);
      } else {
        const html = await htmlNewPage.evaluate(() => document.body.innerHTML);

        fs.writeFileSync(`doc-photo-no-image-${Date.now()}.html`, html);

        console.log('Gambar dengan atribut data-visualcompletion="media-vc-image" tidak ditemukan');
      }
      await randomDelay(1000, 3000); // Delay random antara 3-7 detik
      await imagePage.close();
      await randomDelay(1000, 3000); // Delay random antara 3-7 detik
    }

    lastDocLength = hrefs.length;

    // fs.writeFileSync(`document-link.json`, links);
    // Mengonversi array menjadi string JSON
    const jsonData = JSON.stringify(hrefs, null, 2); // null dan 2 untuk menambah indentation (format yang rapi)
    fs.writeFileSync(`document-link.json`, jsonData);

    await randomDelay(3000, 7000); // Delay random antara 3-7 detik
  }
};

async function main() {
  const cookiesPath = path.resolve(__dirname, 'cookies-fb-chrome.json');
  const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
  // Luncurkan browser
  const browser = await puppeteer.launch({
    headless: true, // set ke true jika tidak perlu melihat browser
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
  //   const html = await page.evaluate(() => document.body.innerHTML);

  //   const html = fs.readFileSync('document.html', 'utf-8');

  // Scroll halaman
  await scrollPage(page, browser);
  // Tutup browser
  await browser.close();
}

main();

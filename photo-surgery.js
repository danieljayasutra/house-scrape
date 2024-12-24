const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { downloadImage, modifyFilename } = require('./download');
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
async function main3(params) {
  try {
    const imgSrc =
      'https://scontent-cgk2-1.xx.fbcdn.net/v/t39.30808-6/470666086_577234665254805_2483254981865708034_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=_4la4xaFb-8Q7kNvgG5AC7U&_nc_zt=23&_nc_ht=scontent-cgk2-1.xx&_nc_gid=AKdO24TTDE_O_YJzUvoL7h0&oh=00_AYAEL-WWcE_hXVCFoKVCGVVRU_pQiBsaZNrwPm2_9b07ig&oe=676FFF29';
    const imageName = path.basename(url.parse(imgSrc).pathname);
    console.log(modifyFilename(imageName));
    const imagePath = path.join(__dirname + '/img', imageName);
  } catch (error) {
    console.log(error.message);
  }
}

main3();

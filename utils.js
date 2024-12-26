// Fungsi untuk menunggu dengan delay random
const randomDelay = (min, max) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(`Waiting for ${delay} ms...`);
  return new Promise((resolve) => setTimeout(resolve, delay));
};

module.exports = {
  randomDelay,
};

const xlsx = require("xlsx");
const fs = require("fs");
const http = require("https");

const excel = fs.readFileSync("./KMC_Inventory.xlsx");
const workbook = xlsx.read(excel);
const sheet = xlsx.utils.sheet_to_json(workbook.Sheets["KMC Inventory"]);

if (!fs.existsSync("./images")) {
  fs.mkdirSync("./images");
}
const filenameRegex = /.*\/(.*)$/;

const fetchImages = async () => {
  const images = sheet
    .filter(item => item["Image URL"] !== "")
    .map(item => item["Image URL"]);
  console.log(`Fetching ${images.length} images.`);
  const batches = images.reduce((result, current) => {
    if (result.length === 0 || result[result.length - 1].length === 20)
      result.push([current]);
    else result[result.length - 1].push(current);
    return result;
  }, []);

  let batchCount = 0;
  while (batches.length > 0) {
    console.log(
      `Fetching images ${batchCount * 20 + 1} through ${batchCount * 20 + 20}`
    );
    batchCount++;
    const batch = batches.shift();
    await fetch(batch);
  }
};

const fetch = async batch => {
  const fetches = batch.map(row => {
    return new Promise((resolve, reject) => {
      const filename = filenameRegex.exec(row)[1];
      const file = fs.createWriteStream(`./images/${filename.trim()}`);
      try {
        const request = http.get(row, function(response) {
          response.pipe(file);
          resolve();
        });
      } catch (err) {
        console.error(row);
      }
    });
  });
  await Promise.all(fetches);
};

fetchImages();

const path = require("path");
const fs = require("fs/promises");

module.exports = async (outputFolder) => {

  const inFolder = path.join(__dirname, "data");
  const outFolder = path.join(outputFolder, "data");

  await fs.readdir(inFolder).then(async (files) => {
    await Promise.all(
      files.map(async (file) => {
        console.info(`Copying static file: ${file}`);
        await fs.copyFile(path.join(inFolder, file), path.join(outFolder, file));
      })
    );
  });
};

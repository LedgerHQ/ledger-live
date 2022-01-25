const fs = require("fs");

exports.readFileJSON = (path) =>
  new Promise((resolve, reject) => {
    fs.readFile(path, "utf-8", (err, data) => {
      if (err) reject(err);
      else {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      }
    });
  });

exports.JSONstringifyReadableArray = (array) =>
  "[\n" + array.map((item) => JSON.stringify(item)).join(",\n") + "\n]";

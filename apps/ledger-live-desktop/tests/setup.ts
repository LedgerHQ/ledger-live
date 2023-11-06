import { rimrafSync } from "rimraf";
import path from "path";
import fs from "fs";

module.exports = () => {
  // ...
  rimrafSync(path.join(__dirname, "coverage"));
  fs.mkdirSync(path.join(__dirname, "coverage"), { recursive: true });
};

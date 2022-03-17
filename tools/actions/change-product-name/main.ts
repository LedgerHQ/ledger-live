import * as core from "@actions/core";
import * as fs from "fs";

const main = async () => {
  const filePath = `${core.getInput("path") || ""}/package.json`;
  const suffix = core.getInput("suffix");
  if (fs.existsSync(filePath)) {
    try {
      const file = fs.readFileSync(filePath, "utf8");
      const json = JSON.parse(file);
      json.productName = `${json.productName} ${suffix}`;
      fs.writeFileSync(filePath, JSON.stringify(json), {
        encoding: "utf8",
        flag: "w",
      });
    } catch (error) {
      core.setFailed(error);
    }
  }
};

main().catch((err) => core.setFailed(err));

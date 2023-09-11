import * as core from "@actions/core";
import * as fs from "fs";
import FormData from "form-data";
import * as path from "path";
import fetch, { Response } from "node-fetch";

function handleErrors(response: Response) {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const clean = (str: string): string =>
  str.replace("-expected.png", "").replace("-actual.png", "").replace("-diff.png", "");

const isDiff = (str: string): boolean => str.includes("diff");
const isActual = (str: string): boolean => str.includes("actual");

const uploadImage = async () => {
  const p = core.getInput("path");
  const os = core.getInput("os").replace("-latest", "");
  const workspace = core.getInput("workspace");
  const fullPath = path.resolve(p);

  const upload = async (file: any, i = 0): Promise<string> => {
    if (i > 2) {
      return "error";
    }
    const body = new FormData();
    body.append("type", "file");
    body.append("image", file);

    try {
      const res = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Client-ID 11eb8a62f4c7927`,
        },
        body,
      }).then(handleErrors);

      const link = ((await res.json()) as { data: { link: string } }).data.link;
      if (!link) {
        throw new Error("no link");
      }
      return link;
    } catch (e) {
      await wait(3000);
      return upload(file, i + 1);
    }
  };

  const getAllFiles = (currentPath: string): string[] => {
    let results: string[] = [];
    const dirents = fs.readdirSync(currentPath, { withFileTypes: true });
    dirents.forEach(dirent => {
      if (dirent.name.toLocaleLowerCase().includes("retry") || dirent.name.endsWith(".zip")) return;
      const newPath = path.resolve(currentPath, dirent.name);
      const stat = fs.statSync(newPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllFiles(newPath));
      } else {
        results.push(newPath);
      }
    });
    return results;
  };

  let files: any[];
  try {
    files = getAllFiles(fullPath);
  } catch {
    fs.writeFileSync(`${workspace}/images-${os}.json`, JSON.stringify([]));
    return core.setOutput("images", []);
  }

  const resultsP = files.map(async file => {
    const img = fs.readFileSync(`${file}`);
    return upload(img);
  });

  const results = await Promise.all(resultsP);

  const formatted: Record<string, any> = {};
  results.forEach((link, index) => {
    const file = files[index];
    const key = clean(file);

    if (!formatted[key]) formatted[key] = { actual: {}, diff: {}, expected: {} };

    const subKey = isActual(file) ? "actual" : isDiff(file) ? "diff" : "expected";
    const name = path.parse(file).name;

    formatted[key][subKey] = {
      link,
      name,
    };
  });

  const final = JSON.stringify(Object.values(formatted));

  console.log(final);

  fs.writeFileSync(`${workspace}/images-${os}.json`, final);
  core.setOutput("images", final);
};

uploadImage().catch(err => {
  core.setFailed(err);
});

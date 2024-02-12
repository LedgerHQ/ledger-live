import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const clean = (str: string): string =>
  str.replace("-expected.png", "").replace("-actual.png", "").replace("-diff.png", "");

const isDiff = (str: string): boolean => str.includes("diff");
const isActual = (str: string): boolean => str.includes("actual");

const uploadImage = async () => {
  const p = core.getInput("path");
  const os = core.getInput("os").replace("-latest", "");
  const workspace = core.getInput("workspace");
  const fullPath = path.resolve(p);
  const region = "eu-west-1";
  const client = new S3Client({
    region,
  });
  const bucket = core.getInput("bucket-name");
  const groupName = core.getInput("group-name");
  core.info("groupName: " + groupName);

  const upload = async (file: Buffer, filename: string): Promise<string> => {
    const key = `${groupName}/${os}/${filename}`;
    core.info("key: " + key);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: "image/png",
    });

    try {
      await client.send(command);
      const url = `https://${bucket}.s3.${region}.amazonaws.com/${groupName}/${os}/${filename}`;
      core.info("url: " + url);
      return url;
    } catch (error) {
      core.error(error as Error);
      console.error(error);
      throw error;
    }
  };

  // https://{bucketName}.s3.{region}.amazonaws.com/{rungroup}/{os}/${imageName}

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
        const extname = path.extname(newPath);
        if (![".png"].includes(extname)) return;
        results.push(newPath);
      }
    });
    return results;
  };

  let files: string[];
  try {
    files = getAllFiles(fullPath);
  } catch {
    fs.writeFileSync(`${workspace}/images-${os}.json`, JSON.stringify([]));
    return core.setOutput("images", []);
  }

  const resultsP = files.map(async file => {
    const basename = path.basename(file);
    core.info("basename: " + basename);
    const img = fs.readFileSync(`${file}`);
    return upload(img, basename);
  });

  const results = await Promise.all(resultsP);

  const formatted: Record<
    string,
    Record<"actual" | "diff" | "expected", { link?: string; name?: string }>
  > = {};
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

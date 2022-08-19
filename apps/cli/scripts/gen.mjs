#!/usr/bin/env zx
import "zx/globals";

const src = path.join(__dirname, "..", "src");
const subfolder = "commands";
const p = path.join(src, subfolder);
async function gen() {
  let imports = ``;
  let exprts = `export default {`;
  for (const file of await fs.promises.readdir(p)) {
    const clean = file.replace(".ts", "");
    imports += `import ${clean} from "./${subfolder}/${clean}";
`;
    exprts += `
  ${clean},`;
  }

  exprts = exprts.substring(0, exprts.length - 1);
  exprts += `
};
`;

  const str = `${imports}
${exprts}`;

  return str;
}

const str = await gen();
await fs.promises.writeFile(path.join(src, "commands-index.ts"), str, "utf8");

#!/usr/bin/env zx
import "zx/globals";

const src = path.join(__dirname, "..", "src");
const subfolder = "commands";
const p = path.join(src, subfolder);
async function gen() {
  let imports = ``;
  let exprts = `export default {`;
  for (const file of await fs.promises.readdir(p)) {
    if (file.endsWith(".ts")) {
      const clean = file.replace(".ts", "");
      imports += `import ${clean} from "./${subfolder}/${clean}";
`;
      exprts += `
  ${clean},`;
    } else {
      // second level is allowed with files in it
      const newp = path.join(p, file);
      for (const f of await fs.promises.readdir(newp)) {
        const clean = f.replace(".ts", "");
        imports += `import ${clean} from "./${subfolder}/${file}/${clean}";
`;
        exprts += `
  ${clean},`;
      }
    }
  }

  exprts += `
};
`;

  const str = `${imports}
${exprts}`;

  return str;
}

const str = await gen();
await fs.promises.writeFile(path.join(src, "commands-index.ts"), str, "utf8");

#!/usr/bin/env zx
import "zx/globals"

cd("src")
const { stdout } = await $`pwd`
const pwd = stdout.replace("\n", "")

const subfolder = "commands"
const p = path.join(pwd, subfolder)
async function gen() {
  let imports = ``
  let exprts = `export default {`
  for (const file of await fs.promises.readdir(p)) {
    const clean = file.replace(".ts", "")
    imports += `import ${clean} from "./${subfolder}/${clean}";
`;
    exprts += `
  ${clean},`

  }

  exprts = exprts.substring(0, exprts.length - 1)
  exprts += `
};
`

  const str = `${imports}
${exprts}`

  return str
}

const str = await gen()
console.log(str)
await fs.promises.writeFile("commands-index.ts", str, "utf8")



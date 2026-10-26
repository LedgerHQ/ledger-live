// oxlint has no `noInlineConfig`: fails on disable comments that are bare or name one of the given rules.
// Usage: node disable-directives.js <rule>[,<rule>…] <extension>[,<extension>…] <dir>…
import fs from "node:fs";
import path from "node:path";

// Every occurrence counts, even inside a string: a false positive is safer than a missed directive.
const DIRECTIVE = /(?:eslint|oxlint)-disable(?:-next-line|-line)?(?![\w-])/g;

function* sourceFiles(dir, extensions) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") yield* sourceFiles(file, extensions);
    } else if (extensions.has(path.extname(entry.name).slice(1))) {
      yield file;
    }
  }
}

export function findDirectives(text, guarded) {
  return [...text.matchAll(DIRECTIVE)]
    .map(match => {
      const start = match.index + match[0].length;
      const inBlock = text.slice(0, match.index).trimEnd().endsWith("/*");
      const ends = [text.indexOf("*/", start), inBlock ? -1 : text.indexOf("\n", start)];
      const end = Math.min(...ends.filter(index => index >= 0), text.length);
      return {
        match,
        rules: text
          .slice(start, end)
          .split("--")[0]
          .split(/[\s,]+/)
          .filter(Boolean),
      };
    })
    .filter(({ rules }) => rules.length === 0 || rules.some(rule => guarded.has(rule)))
    .map(({ match, rules }) => ({
      line: text.slice(0, match.index).split("\n").length,
      directive: [match[0], ...rules].join(" "),
    }));
}

if (import.meta.main) {
  const [rules, extensions, ...dirs] = process.argv.slice(2);
  const guarded = new Set(rules.split(","));
  let count = 0;
  for (const file of dirs.flatMap(dir => [...sourceFiles(dir, new Set(extensions.split(",")))])) {
    for (const { line, directive } of findDirectives(fs.readFileSync(file, "utf8"), guarded)) {
      console.error(`${file}:${line}: \`${directive}\` would silence ${rules}`);
      count++;
    }
  }
  if (count > 0) {
    console.error(`${count} disable comment(s) found: these rules cannot be disabled inline.`);
    process.exitCode = 1;
  }
}

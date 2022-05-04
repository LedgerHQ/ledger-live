const { promises: fs } = require("fs");
const path = require("path");
const semver = require("semver");

const getCleanVersion = str => {
  return str.replace("# ", "").trim();
};

async function main() {
  const file = await fs.readFile(path.resolve(__dirname, "..", "..", "RELEASE_NOTES.md"), "utf8");
  const pkg = JSON.parse(
    await fs.readFile(path.resolve(__dirname, "..", "..", "package.json"), "utf8"),
  );
  const parsed = semver.parse(pkg.version);
  const split = file.split("\n");

  const saved = {};

  let currentVersion;
  for (const line of split) {
    const isVersionLine = line.startsWith("# ");
    const clean = getCleanVersion(line);
    if (isVersionLine) {
      currentVersion = clean;
      if (
        !semver.satisfies(
          clean,
          `< ${parsed.major}.${parsed.minor + 1} >= ${parsed.major}.${parsed.minor}`,
        )
      ) {
        currentVersion = null;
      }
    } else {
      if (currentVersion) {
        if (!saved[currentVersion]) saved[currentVersion] = [];
        saved[currentVersion].push(line);
      }
    }
  }

  const output = Object.entries(saved)
    .map(
      /* eslint-disable-next-line */
      ([tag_name, body]) => ({
        tag_name,
        body: body.join("\n"),
      }),
      {},
    )
    .sort((a, b) => {
      if (semver.gt(a.tag_name, b.tag_name)) {
        return -1;
      } else if (semver.gt(b.tag_name, a.tag_name)) {
        return 1;
      } else {
        return 0;
      }
    });

  await fs.writeFile(
    path.resolve(__dirname, "..", "..", "release-notes.json"),
    JSON.stringify(output, null, 2),
    "utf8",
  );
}

module.exports = main;

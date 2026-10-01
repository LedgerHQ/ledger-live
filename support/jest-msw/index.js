// msw 3 and these dependencies ship ESM only, and two of them (rettime, @msw/url) ship `.mjs` only.
// Jest runs CommonJS, so every config that loads msw has to compile them.
const mswEsmPackages = [
  "msw",
  "@mswjs/interceptors",
  "rettime",
  "until-async",
  "@msw/url",
  "cookie",
  "@open-draft/until",
];

const escape = name => name.replace("/", "\\+");

// Matches the package's folder in the pnpm virtual store, e.g. `node_modules/.pnpm/msw@3.0.1_…`.
const mswEsmPnpmDirs = mswEsmPackages.map(name => `${escape(name)}@`);

const mswTransform = {
  [`node_modules[\\\\/]\\.pnpm[\\\\/](${mswEsmPnpmDirs.join("|")}).+\\.m?js$`]: [
    require.resolve("@swc/jest"),
    { jsc: { target: "esnext" } },
  ],
};

module.exports = { mswEsmPackages, mswEsmPnpmDirs, mswTransform };

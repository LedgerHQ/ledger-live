module.exports = (path, options) => {
  // Call the defaultResolver, so we leverage its cache, error handling, etc.
  return options.defaultResolver(path, {
    ...options,
    // Use packageFilter to process parsed `package.json` before the resolution (see https://www.npmjs.com/package/resolve#resolveid-opts-cb)
    packageFilter: pkg => {
      const pkgNamesToTarget = new Set([
        "rpc-websockets",
        "@solana/codecs",
        "@solana/codecs-core",
        "@solana/errors",
        "@solana/codecs-data-structures",
        "@solana/codecs-numbers",
        "@solana/codecs-strings",
        "@solana/options",
      ]);

      if (pkgNamesToTarget.has(pkg.name)) {
        // console.log('>>>', pkg.name)
        delete pkg["exports"];
        delete pkg["module"];
      }

      return pkg;
    },
  });
};

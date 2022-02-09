function readPackage(pkg, context) {
  if (!pkg?.name) {
    console.log("no name found");
    console.log({ pkg }, { context });
  }
  // Prevents duplicate packages.
  if (
    ["react-redux", "styled-components"].some(
      (pkgName) => pkgName === pkg?.name
    )
  ) {
    delete pkg.peerDependencies;
    delete pkg.peerDependenciesMeta;
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};

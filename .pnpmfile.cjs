function readPackage(pkg, context) {
  // Prevents duplicate packages.
  if (
    ["react-redux", "styled-components"].some((pkgName) => pkgName === pkg.name)
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

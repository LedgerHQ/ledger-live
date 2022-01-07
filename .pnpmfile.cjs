function readPackage(pkg, context) {
  // Prevents duplicate packages.
  if (pkg.name === "react-redux") {
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

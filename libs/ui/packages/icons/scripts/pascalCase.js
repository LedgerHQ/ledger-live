const pascalCase = parts =>
  parts
    .join("-")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
    .replace(/(?:^|[-_. ]+)(\w)/g, (_, c) => c.toUpperCase())
    .replace(/\d+(\w|$)/g, m => m.toUpperCase());

module.exports = { pascalCase };

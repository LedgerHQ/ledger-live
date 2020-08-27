const path = require("path");
const { readFileJSON } = require("../utils");

const idFromFolderAndFile = (folder, id) =>
  folder.includes("tokens/") ? `${folder.split("tokens/")[1]}/${id}` : "" + id;

module.exports = {
  path: "tokens/ethereum/erc20",
  output: "exchange/erc20.js",
  outputTemplate: (data) =>
    "export default [" +
    data.map((item) => JSON.stringify(item)).join(",\n\t") +
    "];\n",

  loader: ({ folder, id }) =>
    Promise.all([
      readFileJSON(path.join(folder, id, "exchange_signature.json")),
    ]).then(([exchange]) => {
      return [
        idFromFolderAndFile(folder, id),
        exchange.serialized_config,
        exchange.signature,
      ];
    }),
};

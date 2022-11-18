const path = require("path");
const { readFileJSON } = require("../utils");

const idFromFolderAndFile = (folder, id) =>
  folder.includes("tokens/") ? `${folder.split("tokens/")[1]}/${id}` : "" + id;

module.exports = {
  paths: ["tokens/ethereum/erc20"],
  output: (toJSON) => `data/exchange/erc20.js${toJSON ? "on" : ""}`,
  outputTemplate: (data, toJSON) =>
    toJSON
      ? JSON.stringify(data)
      : "module.exports = [" +
        data.map((item) => JSON.stringify(item)).join(",\n\t") +
        "];\n",

  loader: ({ signatureFolder, folder, id }) =>
    Promise.all([
      readFileJSON(path.join(signatureFolder, id, "exchange_signature.json")),
    ]).then(([exchange]) => {
      return [
        idFromFolderAndFile(folder, id),
        exchange.serialized_config,
        exchange.signature,
      ];
    }),
};

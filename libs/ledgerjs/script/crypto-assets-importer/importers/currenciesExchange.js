const path = require("path");
const { readFileJSON } = require("../utils");

const idFromFolderAndFile = (folder, id) =>
  folder.includes("tokens/") ? `${folder.split("tokens/")[1]}/${id}` : "" + id;

module.exports = {
  paths: ["coins"],
  output: (toJSON) => `data/exchange/coins.${toJSON ? "json" : "ts"}`,
  outputTemplate: (data, toJSON) =>
    toJSON
      ? JSON.stringify(data)
      : `export type Exchange = [string, string, string];
const exchanges: Exchange[] = [
  ${data.map((item) => JSON.stringify(item)).join(",\n\t")}
];

export default exchanges;
`,
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

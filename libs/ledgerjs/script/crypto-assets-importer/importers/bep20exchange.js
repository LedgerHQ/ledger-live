const path = require("path");
const { readFileJSON } = require("../utils");

const idFromFolderAndFile = (folder, id) =>
  folder.includes("tokens/") ? `${folder.split("tokens/")[1]}/${id}` : "" + id;

module.exports = {
  paths: ["tokens/bsc/bep20"],
  output: (toJSON) => `data/exchange/bep20.${toJSON ? "json" : "ts"}`,
  outputTemplate: (data, toJSON) =>
    toJSON
      ? JSON.stringify(data)
      : `export type BEP20Exchange = [string, string, string];

const exchanges: BEP20Exchange[] = [
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

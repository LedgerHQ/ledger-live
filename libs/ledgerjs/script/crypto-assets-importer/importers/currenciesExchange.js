const path = require("path");
const fs = require("fs");
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
  loader: ({ signatureFolder, folder, id }) => {
    const filePath = path.join(signatureFolder, id, "exchange_signature.json");
    if (!fs.existsSync(filePath)) return;

    return readFileJSON(filePath).then((exchange) => [
      idFromFolderAndFile(folder, id),
      exchange.serialized_config,
      exchange.signature,
    ]);
  },
};

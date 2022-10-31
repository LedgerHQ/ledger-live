const fs = require("fs");
const path = require("path");
const { readFileJSON } = require("../utils");

module.exports = {
  paths: [
    "dapps/ethereum",
    "dapps/bsc",
    "dapps/polygon",
    "dapps/ethereum_ropsten",
    "dapps/ethereum_goerli",
  ],
  output: (toJSON) => `data/eip712.js${toJSON ? "on" : ""}`,

  outputTemplate: ([data], toJSON) => {
    const stringifiedData = JSON.stringify(data ? data : {});
    return toJSON ? stringifiedData : `module.exports = ${stringifiedData};\n`;
  },

  loader: async ({ signatureFolder, id }) => {
    try {
      const signatures = await readFileJSON(
        path.join(signatureFolder, id, "eip712_signatures.json")
      );

      const convertedSignatures = {};
      Object.entries(signatures).forEach(([messageId, value]) => {
        Object.entries(value).forEach(([schemaHash, mappers]) => {
          convertedSignatures[`${messageId}:${schemaHash}`] = mappers;
        });
      });

      return convertedSignatures;
    } catch (e) {
      return null;
    }
  },
};

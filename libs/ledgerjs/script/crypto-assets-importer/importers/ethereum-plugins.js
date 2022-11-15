const path = require("path");
const fs = require('fs');
const isEqual = require("lodash/isEqual");
const { readFileJSON } = require("../utils");

const mapObject = (obj, fn) => Object.fromEntries(Object.entries(obj).map(fn));

module.exports = {
  paths: ["dapps/ethereum", "dapps/bsc", "dapps/polygon", "dapps/ethereum_ropsten", "dapps/ethereum_goerli"],
  output: () => "ethereum.json", // to be put in crypto assets list

  join: (d) => {
    // merge together all methods with the same contract id
    // for instance if paraswapv4 is on eth, it will merge all other cross chain data that would happen to have same contract address
    const all = {};
    d.forEach((obj) => {
      for (const contractAddress in obj) {
        const existing = all[contractAddress];
        if (existing && !isEqual(existing.abi, obj[contractAddress].abi)) {
          // eslint-disable-next-line no-undef
          console.warn(
            "plugin contract " +
              contractAddress +
              "seem to have two different abi for same contract address!"
          );
        }
        all[contractAddress] = {
          ...existing,
          ...obj[contractAddress],
        };
      }
    });
    return all;
  },

  outputTemplate: (data) => JSON.stringify(data, null, 2),

  shouldLoad: ({ folder, id }) => {
    const b2cFilePath = path.join(folder, id, "b2c.json");
    return fs.existsSync(b2cFilePath);
  },

  loader: async ({ signatureFolder, folder, id }) => {
    const [signatures, bare] = await Promise.all([
      readFileJSON(path.join(signatureFolder, id, "b2c_signatures.json")),
      readFileJSON(path.join(folder, id, "b2c.json")),
    ]);

    const addresses = Object.keys(signatures);

    const abisList = await Promise.all(
      addresses.map((address) =>
        readFileJSON(path.join(folder, id, "abis", `${address}.abi.json`))
          .catch(() =>
            readFileJSON(path.join(folder, id, "abis", `${address}.json`))
          )
          .catch((e) => {
            console.warn(`${id} ${address} failed to load`, e);
          })
      )
    );

    const abis = addresses.reduce(
      (acc, address, i) => ({
        ...acc,
        [address.toLowerCase()]: abisList[i],
      }),
      {}
    );

    return bare.contracts.reduce((acc, contract) => {
      const key = contract.address.toLowerCase();
      const abi = abis[key];
      if (!abi) {
        console.warn("not abi found for " + key + " on " + id);
      }

      return {
        ...acc,
        [key]: {
          ...mapObject(contract.selectors, ([selector, data]) => [
            selector,
            {
              ...(signatures[key][selector] || {}),
              erc20OfInterest: data.erc20OfInterest,
            },
          ]),
          abi,
        },
      };
    }, {});
  },
};

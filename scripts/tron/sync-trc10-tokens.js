const path = require("path");
const fs = require("fs");
const get = require("lodash/get");
const bs58check = require("bs58check");
const network = require("axios");
const trc10Tokens = require("./trc10-tokens");

const { signedList, whitelist } = trc10Tokens;

const b58 = hex => bs58check.encode(Buffer.from(hex, "hex"));

const convertTRC10 = ({ name, abbr, id, owner_address, precision, delisted, ledgerSignature }) => [
  id,
  abbr,
  name,
  b58(owner_address),
  precision || 0,
  delisted,
  ledgerSignature
];

async function fetch(url) {
  const { data } = await network({
    method: "GET",
    url
  });
  return data;
}

async function fetchTrc10Tokens() {
  const getTrc10Tokens = async (url) =>
    fetch(url).then(resp => {
      const nextUrl = get(resp, "meta.links.next");
      const results = resp.data;
      return { nextUrl, results };
    });
  
  const getEntireTrc10Tokens = async (url) => {
    const response = await getTrc10Tokens(url);

    if (response.nextUrl) {
      const nextResponse = await getEntireTrc10Tokens(response.nextUrl);
      return {
        results: response.results.concat(nextResponse.results),
        nextUrl: nextResponse.nextUrl
      };
    } else {
      return response;
    }
  };

  const result = await getEntireTrc10Tokens("https://api.trongrid.io/v1/assets?limit=200");
  const tokens = 
    result.results
      .map(r => {
        const ledgerSignature = 
          get(
            signedList.find(t => t.id.toString() === r.id),
            "message",
            undefined
          );

        const delisted = !ledgerSignature || !whitelist.some(id => id.toString() === r.id);

        return convertTRC10({ ...r, delisted, ledgerSignature })
      });  

  return tokens;
}

const outputFolder = path.join(__dirname, "../../src/load");

fetchTrc10Tokens().then(array => {
  fs.writeFileSync(
    path.join(outputFolder, "tokens/tron/trc10.js"),
    'require("../../../families/tron/tokens").add("trc10", ' +
      "[\n" +
      array.map(item => JSON.stringify(item)).join(",\n") +
      "\n]" +
      ");",
    "utf-8"
  );
  console.log(`Wrote ${array.length} tokens in src/load/tokens/tron/trc10.js`)
});

const path = require("path");
const fs = require("fs");
const get = require("lodash/get");
const compact = require("lodash/compact");
const bs58check = require("bs58check");
const network = require("axios");
const trc10Tokens = require("./trc10-tokens");

const { signedList, whitelist } = trc10Tokens;

const ts = `export type TRC10Token = [
  number, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean, // delisted
  string, // ledgerSignature
  boolean? // enableCountervalues
];

import tokens from "./trc10.json";

export default tokens as TRC10Token[];
`;

const b58 = (hex) => bs58check.encode(Buffer.from(hex, "hex"));

const convertTRC10 = ({
  name,
  abbr,
  id,
  owner_address,
  precision,
  delisted,
  ledgerSignature,
}) => [
  id,
  abbr.toUpperCase(),
  name,
  b58(owner_address),
  precision || 0,
  delisted,
  ledgerSignature,
];

async function fetch(url) {
  const { data } = await network({
    method: "GET",
    url,
  });
  return data;
}

async function fetchTrc10Tokens() {
  const getTrc10Tokens = async (url) =>
    fetch(url).then((resp) => {
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
        nextUrl: nextResponse.nextUrl,
      };
    } else {
      return response;
    }
  };

  const result = await getEntireTrc10Tokens(
    "https://api.trongrid.io/v1/assets?limit=200"
  );
  const tokens = result.results.map((r) => {
    const ledgerSignature = get(
      signedList.find((t) => t.id.toString() === r.id.toString()),
      "message",
      undefined
    );

    if (!ledgerSignature) return null;

    if (!r.abbr || !r.abbr.match(/^[0-9a-zA-Z]+$/g) || r.abbr.length > 12) {
      console.warn(
        `${r.abbr} ticker not satisfying. (${r.id}, ${r.owner_address})`
      );
      return null;
    }

    const delisted = !whitelist.some((id) => id.toString() === r.id);

    return convertTRC10({ ...r, delisted, ledgerSignature });
  });

  return compact(tokens);
}

const outputFolder = path.join(
  __dirname,
  "../../../packages/cryptoassets/src/data"
);

fetchTrc10Tokens().then((array) => {
  fs.writeFileSync(path.join(outputFolder, "trc10.json"), JSON.stringify(array), "utf-8");
  fs.writeFileSync(path.join(outputFolder, "trc10.ts"), ts,"utf-8");
  console.log(`Wrote ${array.length} tokens in trc10.json`);
});

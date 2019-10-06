const path = require("path");
const fs = require("fs");
const get = require("lodash/get");
const bs58check = require("bs58check");
const network = require("axios");

const b58 = hex => bs58check.encode(Buffer.from(hex, "hex"));

const convertTRC10 = ({ name, abbr, id, owner_address, precision }) => [
  id,
  abbr,
  name,
  b58(owner_address),
  precision || 0
];

async function fetch(url) {
  const { data } = await network({
    method: "GET",
    url
  });
  return data;
}

async function fetchTokens() {
  let payload = await fetch("https://api.trongrid.io/v1/assets?limit=200");
  let els = payload.data;
  let tokens = [];
  while (els && Array.isArray(els)) {
    tokens = tokens.concat(els.map(convertTRC10).filter(Boolean));
    const next = get(payload, "meta.links.next");
    if (!next) break;
    payload = await fetch(next);
    els = payload.data;
  }
  return tokens;
}

const outputFolder = path.join(__dirname, "../src/load");

fetchTokens().then(array =>
  fs.writeFileSync(
    path.join(outputFolder, "tokens/tron/trc10.js"),
    'require("../../../families/tron/tokens").add("trc10", ' +
      "[\n" +
      array.map(item => JSON.stringify(item)).join(",\n") +
      "\n]" +
      ");",
    "utf-8"
  )
);

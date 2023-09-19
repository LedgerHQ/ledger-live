import fs from "fs";
import axios from "axios";
import bs58check from "bs58check";
import path from "path";
import { signedList, whitelist } from "./trc10-tokens";

type TrongridAsset = {
  id: number;
  abbr: string;
  description: string;
  name: string;
  num: number;
  precision: number;
  url: string;
  total_supply: number;
  trx_num: number;
  vote_score: number;
  owner_address: string;
  start_time: number;
  end_time: number;
};

type TRC10 = TrongridAsset & {
  delisted: boolean;
  ledgerSignature: string;
};

type TRC10Token = [
  number, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean, // delisted
  string, // ledgerSignature
  boolean?, // enableCountervalues
];

type TrongridAssetResponse = {
  data: TrongridAsset[];
  meta: {
    at: number;
    fingerprint: string;
    links?: { next: string };
  };
};

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

const b58 = (hex: string) => bs58check.encode(Buffer.from(hex, "hex"));

const convertTRC10 = ({
  name,
  abbr,
  id,
  owner_address,
  precision,
  delisted,
  ledgerSignature,
}: TRC10): TRC10Token => [
  id,
  abbr.toUpperCase(),
  name,
  b58(owner_address),
  precision || 0,
  delisted,
  ledgerSignature,
];

const TRONGRID_TOKENS_URL = "https://api.trongrid.io/v1/assets?limit=200";

export const importTRC10Tokens = async (outputDir: string) => {
  console.log("importing trc10 tokens...");
  const allTokens: TrongridAsset[] = [];
  const { data } = await axios.get<TrongridAssetResponse>(TRONGRID_TOKENS_URL);
  allTokens.push(...data.data);
  let nextLink = data.meta.links?.next;

  while (nextLink) {
    const { data } = await axios.get<TrongridAssetResponse>(nextLink);
    allTokens.push(...data.data);
    nextLink = data.meta.links?.next;
  }

  const tokens = allTokens
    .map(token => {
      const tokenSignature = signedList.find(signature => signature.id === token.id);
      const ledgerSignature = tokenSignature?.message;

      if (!ledgerSignature) return null;

      const delisted = !whitelist.some(id => id === token.id);

      return convertTRC10({ ...token, delisted, ledgerSignature });
    })
    .filter((token): token is TRC10Token => !!token);

  const filePath = path.join(outputDir, "trc10");
  fs.writeFileSync(`${filePath}.json`, JSON.stringify(tokens));
  fs.writeFileSync(`${filePath}.ts`, ts);

  console.log(`importing trc10 tokens success, imported ${tokens.length} tokens`);
};

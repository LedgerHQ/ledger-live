import fs from "fs";
import { fetchTokens } from "../fetch";
import { log } from "console";

export type AlgorandASAToken = [
  string, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean?, // enableCountervalues
];

export const importAsaTokens = async (outputFolder: string) => {
  log("importing asa tokens...");
  const asaTokens = await fetchTokens<AlgorandASAToken[]>("asa.json");
  fs.writeFileSync(`${outputFolder}/asa.json`, JSON.stringify(asaTokens));
  fs.writeFileSync(
    `${outputFolder}/asa.ts`,
    `export type AlgorandASAToken = [
          string, // id
          string, // abbr
          string, // name
          string, // contractAddress
          number, // precision
          boolean?, // enableCountervalues
        ];
        
        import tokens from "./asa.json";
        
        export default tokens as AlgorandASAToken[];
        `,
  );

  log("importing asa tokens sucess");
};

export type AlgorandASAToken = [
  string, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
];

import tokens from "./asa.json";

export { default as hash } from "./asa-hash.json";

export default tokens as AlgorandASAToken[];

export type SuiToken = [
  string, // id
  string, // name
  string, // ticker
  string, // address
  number, // decimals
  string, // live_signature
];

import tokens from "./sui.json";

export { default as hash } from "./sui-hash.json";

export default tokens as SuiToken[];

export type BEP20Exchange = [string, string, string];

export { default as hash } from "./bep20-hash.json";

import tokens from "./bep20.json";

export default tokens as BEP20Exchange[];

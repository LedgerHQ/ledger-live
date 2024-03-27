export type Exchange = [string, string, string];

export { default as hash } from "./coin-hash.json";

import exchanges from "./coins.json";

export default exchanges as Exchange[];

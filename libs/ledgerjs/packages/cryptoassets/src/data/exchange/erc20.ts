export type ERC20Exchange = [string, string, string];

export { default as hash } from "./erc20-hash.json";

import exchanges from "./erc20.json";

export default exchanges as ERC20Exchange[];

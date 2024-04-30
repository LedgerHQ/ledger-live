export type TRC20Exchange = [string, string, string];

export { default as hash } from "./trc20-hash.json";

import exchanges from "./trc20.json";

export default exchanges[0] as TRC20Exchange[];

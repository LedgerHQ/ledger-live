// Expose only strict necessary coin-module logic to LLD and LLM
export {
  getSecp256k1Instance,
  setSecp256k1Instance,
} from "@ledgerhq/coin-bitcoin/wallet-btc/crypto/secp256k1";

export { getUTXOStatus } from "@ledgerhq/coin-bitcoin/logic";

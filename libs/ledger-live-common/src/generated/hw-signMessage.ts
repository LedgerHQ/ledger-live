import { messageSigner as bitcoin } from "../families/bitcoin/setup";
import { messageSigner as evm } from "../families/evm/setup";
import { messageSigner as solana } from "../families/solana/setup";

export default {
  bitcoin,
  evm,
  solana,
};

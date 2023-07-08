import bitcoin from "../families/bitcoin/hw-signMessage";
import ethereum from "../families/ethereum/hw-signMessage";
import filecoin from "../families/filecoin/hw-signMessage";
import { messageSigner as evm } from "../families/evm/setup";

export default {
  bitcoin,
  ethereum,
  filecoin,
  evm,
};

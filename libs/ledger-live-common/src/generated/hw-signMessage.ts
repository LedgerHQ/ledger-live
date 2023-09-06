import bitcoin from "../families/bitcoin/hw-signMessage";
import ethereum from "../families/ethereum/hw-signMessage";
import filecoin from "../families/filecoin/hw-signMessage";
import vechain from "../families/vechain/hw-signMessage";
import internet_computer from "../families/internet_computer/hw-signMessage";
import stacks from "../families/stacks/hw-signMessage";
import { messageSigner as evm } from "../families/evm/setup";

export default {
  bitcoin,
  ethereum,
  filecoin,
  vechain,
  internet_computer,
  stacks,
  evm,
};

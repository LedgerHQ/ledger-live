import casper from "../families/casper/hw-signMessage";
import filecoin from "../families/filecoin/hw-signMessage";
import internet_computer from "../families/internet_computer/hw-signMessage";
import stacks from "../families/stacks/hw-signMessage";
import vechain from "../families/vechain/hw-signMessage";
import { messageSigner as bitcoin } from "../families/bitcoin/setup";
import { messageSigner as evm } from "../families/evm/setup";

export default {
  casper,
  filecoin,
  internet_computer,
  stacks,
  vechain,
  bitcoin,
  evm,
};

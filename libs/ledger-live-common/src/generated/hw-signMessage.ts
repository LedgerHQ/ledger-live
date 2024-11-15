import casper from "../families/casper/hw-signMessage";
import internet_computer from "../families/internet_computer/hw-signMessage";
import { messageSigner as bitcoin } from "../families/bitcoin/setup";
import { messageSigner as evm } from "../families/evm/setup";
import { messageSigner as filecoin } from "../families/filecoin/setup";
import { messageSigner as ton } from "../families/ton/setup";

export default {
  casper,
  internet_computer,
  bitcoin,
  evm,
  filecoin,
  ton,
};

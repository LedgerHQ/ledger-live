import casper from "../families/casper/hw-signMessage";
import { messageSigner as bitcoin } from "../families/bitcoin/setup";
import { messageSigner as evm } from "../families/evm/setup";
import { messageSigner as filecoin } from "../families/filecoin/setup";
import { messageSigner as internet_computer } from "../families/internet_computer/setup";
import { messageSigner as ton } from "../families/ton/setup";

export default {
  casper,
  bitcoin,
  evm,
  filecoin,
  internet_computer,
  ton,
};

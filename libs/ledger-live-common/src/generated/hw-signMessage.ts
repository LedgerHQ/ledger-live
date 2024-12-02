import casper from "../families/casper/hw-signMessage";
import { messageSigner as bitcoin } from "../families/bitcoin/setup";
import { messageSigner as evm } from "../families/evm/setup";
import { messageSigner as filecoin } from "../families/filecoin/setup";
import { messageSigner as icp } from "../families/icp/setup";
import { messageSigner as ton } from "../families/ton/setup";

export default {
  casper,
  bitcoin,
  evm,
  filecoin,
  icp,
  ton,
};

import { messageSigner as bitcoin } from "../families/bitcoin/setup";
import { messageSigner as casper } from "../families/casper/setup";
import { messageSigner as evm } from "../families/evm/setup";
import { messageSigner as filecoin } from "../families/filecoin/setup";
import { messageSigner as internet_computer } from "../families/internet_computer/setup";
import { messageSigner as solana } from "../families/solana/setup";
import { messageSigner as ton } from "../families/ton/setup";

export default {
  bitcoin,
  casper,
  evm,
  filecoin,
  internet_computer,
  solana,
  ton,
};

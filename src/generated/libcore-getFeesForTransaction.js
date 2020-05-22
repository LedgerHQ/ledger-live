// @flow
import bitcoin from "../families/bitcoin/libcore-getFeesForTransaction.js";
import cosmos from "../families/cosmos/libcore-getFeesForTransaction.js";
import ethereum from "../families/ethereum/libcore-getFeesForTransaction.js";
import tezos from "../families/tezos/libcore-getFeesForTransaction.js";

export default {
  bitcoin,
  cosmos,
  ethereum,
  tezos,
};

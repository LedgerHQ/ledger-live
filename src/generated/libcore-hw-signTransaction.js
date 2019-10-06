// @flow
import bitcoin from "../families/bitcoin/libcore-hw-signTransaction.js";
import ethereum from "../families/ethereum/libcore-hw-signTransaction.js";
import ripple from "../families/ripple/libcore-hw-signTransaction.js";
import tezos from "../families/tezos/libcore-hw-signTransaction.js";

export default {
  bitcoin,
  ethereum,
  ripple,
  tezos,
};

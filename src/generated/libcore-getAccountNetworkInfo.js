// @flow
import bitcoin from "../families/bitcoin/libcore-getAccountNetworkInfo.js";
import ethereum from "../families/ethereum/libcore-getAccountNetworkInfo.js";
import ripple from "../families/ripple/libcore-getAccountNetworkInfo.js";
import stellar from "../families/stellar/libcore-getAccountNetworkInfo.js";
import tezos from "../families/tezos/libcore-getAccountNetworkInfo.js";

export default {
  bitcoin,
  ethereum,
  ripple,
  stellar,
  tezos,
};

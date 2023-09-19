import bitcoin from "../families/bitcoin/walletApiAdapter";
import evm from "../families/evm/walletApiAdapter";
import polkadot from "@ledgerhq/coin-polkadot/walletApiAdapter";
import ripple from "../families/ripple/walletApiAdapter";

export default {
  bitcoin,
  evm,
  polkadot,
  ripple,
};

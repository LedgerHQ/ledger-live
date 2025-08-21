import BigNumber from "bignumber.js";

// TODO: remove this when we have a proper way to handle this
export const KDA_DECIMALS = 12;
export const KDA_FEES_BASE = "1.0e-6";
export const KDA_FEES = BigNumber(KDA_FEES_BASE).times(10 ** KDA_DECIMALS);
export const KDA_GAS_LIMIT_TRANSFER = BigNumber(2300); // '2300' is the GasLimit indicated for most of the transaction so it should be more than enough

export const KDA_NETWORK = "mainnet01"; // testnet04 is the network id for the testnet
export const KDA_CHAINWEB_VER = "0.0";

export const KADENA_CROSS_CHAIN_TRANSFER_EVENT_NAME = "coin.TRANSFER_XCHAIN";

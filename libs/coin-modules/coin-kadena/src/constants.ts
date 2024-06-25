import BigNumber from "bignumber.js";

// TODO: remove this when we have a proper way to handle this
export const KDA_DECIMALS = 12;
export const KDA_FEES = BigNumber('1.0e-6').times(10 ** KDA_DECIMALS);
export const KDA_GAS_LIMIT_TRANSFER = BigNumber(2300); // '2300' is the GasLimit indicated for most of the transaction so it should be more than enought

export const KDA_NETWORK = "testnet04";
export const KDA_CHAINWEB_VER = "0.0";

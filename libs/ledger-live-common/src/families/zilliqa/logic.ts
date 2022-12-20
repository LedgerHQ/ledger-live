import { BigNumber } from "bignumber.js";
import { ZilliqaAccount } from "./types";
export const MAX_AMOUNT = 5000;

/**
 * Returns true if address is a valid md5
 *
 * @param {string} address
 */
export const isValidAddress = (address: string): boolean => {
    console.log("ZILLIQA: isValidAddress.");
    if (!address) {
        return false;
    }

    return !!address.match(/^[a-f0-9]{32}$/);
};

/**
 * Returns true if transaction amount is less than MAX AMOUNT and > 0
 *
 * @param {BigNumber} amount
 */
export const specificCheck = (amount: BigNumber): boolean => {
    console.log("ZILLIQA: specificCheck.");
    return amount.gt(0) && amount.lte(MAX_AMOUNT);
};

/**
 * Returns nonce for an account
 *
 * @param {Account} a
 */
export const getNonce = (a: ZilliqaAccount): number => {
    console.log("ZILLIQA: getNonce.");
    return a.zilliqaResources ? a.zilliqaResources.nonce : 1;
};

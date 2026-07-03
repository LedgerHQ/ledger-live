"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMinimumSellAmount = getMinimumSellAmount;
const currencyUtils_1 = require("./currencyUtils");
const index_1 = require("./index");
const axios_1 = __importDefault(require("axios"));
const BUY_SELL_BASE_URL = "https://buy.api.aws.prd.ldg-tech.com";
const SELL_CRYPTO_LIMITATION_ENDPOINT = "/sell/v1/cryptoLimitations";
const FALLBACK_TARGET_USD = 10;
async function getMinimumSellAmount(currencyId) {
    const amount = await fetchMinimumSellAmount(currencyId);
    if (amount === null) {
        throw new Error(`Could not determine minimum sell amount for "${currencyId}"`);
    }
    const factor = 10 ** 6;
    const roundedUp = Math.ceil((amount - Number.EPSILON) * factor) / factor;
    return roundedUp.toString();
}
async function fetchMinimumSellAmount(currencyId) {
    try {
        const requestConfig = {
            method: "GET",
            url: BUY_SELL_BASE_URL + SELL_CRYPTO_LIMITATION_ENDPOINT,
            headers: { accept: "application/json" },
        };
        const { data } = await (0, axios_1.default)(requestConfig);
        const rawMaxOfMin = data?.value?.[currencyId]?.maxOfMin;
        const maxOfMin = rawMaxOfMin !== undefined ? Number.parseFloat(rawMaxOfMin) : Number.NaN;
        if (!Number.isNaN(maxOfMin) && maxOfMin > 0) {
            return maxOfMin;
        }
        console.warn(`No sell limitation found for "${currencyId}", ` +
            `computing fallback from countervalues (~$${FALLBACK_TARGET_USD} USD)`);
        return await (0, currencyUtils_1.getAmountFromUSD)(currencyId, FALLBACK_TARGET_USD);
    }
    catch (error) {
        const sanitizedError = (0, index_1.sanitizeError)(error);
        console.warn("Error fetching sell minimum amount:", sanitizedError);
        // Last resort: try to compute a sensible amount even if the limitations call failed entirely.
        try {
            return await (0, currencyUtils_1.getAmountFromUSD)(currencyId, FALLBACK_TARGET_USD);
        }
        catch {
            return null;
        }
    }
}
//# sourceMappingURL=buySell.js.map
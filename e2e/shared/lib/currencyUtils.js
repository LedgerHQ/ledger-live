"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAmountFromUSD = getAmountFromUSD;
const index_1 = require("./index");
const axios_1 = __importDefault(require("axios"));
const COUNTERVALUES_URL = "https://countervalues.live.ledger.com/v3/spot/simple";
/**
 * Fetches the current USD price for a currency from the Ledger countervalues API
 * and converts a target USD value into the equivalent crypto amount.
 */
async function getAmountFromUSD(currencyId, targetUSD) {
    try {
        const { data } = await axios_1.default.get(COUNTERVALUES_URL, {
            params: {
                froms: currencyId,
                to: "USD",
            },
        });
        const price = data?.[currencyId];
        if (!price || price <= 0) {
            console.warn(`No USD price found for ${currencyId}`);
            return null;
        }
        return targetUSD / price;
    }
    catch (error) {
        console.warn(`Failed to fetch countervalue for ${currencyId}:`, (0, index_1.sanitizeError)(error));
        return null;
    }
}
//# sourceMappingURL=currencyUtils.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXO_ADDRESS_CACHE_FILE = void 0;
exports.getUtxoAddressCachePath = getUtxoAddressCachePath;
exports.getCachedUtxoAddress = getCachedUtxoAddress;
const path_1 = __importDefault(require("path"));
const addressCache_1 = require("./addressCache");
exports.UTXO_ADDRESS_CACHE_FILE = "utxoAddresses.json";
function getUtxoAddressCachePath() {
    const dir = (0, addressCache_1.getAddressCacheDir)();
    return dir ? path_1.default.join(dir, exports.UTXO_ADDRESS_CACHE_FILE) : null;
}
function getCachedUtxoAddress(account) {
    if (account.currency.id.includes("/"))
        return null;
    if (!(0, addressCache_1.isUtxoBasedCurrency)(account.currency.id))
        return null;
    const entries = (0, addressCache_1.readCacheFileAt)(getUtxoAddressCachePath())?.addresses?.[account.currency.id];
    const address = Array.isArray(entries) ? (0, addressCache_1.matchEntry)(entries, account)?.address : undefined;
    return address ?? null;
}
//# sourceMappingURL=utxoAddressCache.js.map
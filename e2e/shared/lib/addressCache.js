"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADDRESS_CACHE_FILE = void 0;
exports.isUtxoBasedCurrency = isUtxoBasedCurrency;
exports.getAddressCacheDir = getAddressCacheDir;
exports.getAddressCachePath = getAddressCachePath;
exports.readCacheFileAt = readCacheFileAt;
exports.matchEntry = matchEntry;
exports.getCachedAddress = getCachedAddress;
exports.setCachedAddressEntry = setCachedAddressEntry;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const helpers_1 = require("@ledgerhq/live-common/currencies/helpers");
const ENV_DIR = "E2E_GENERATED_ADDRESSES_DIR";
const ENV_USERDATA_DIR = "E2E_GENERATED_USERDATA_DIR";
exports.ADDRESS_CACHE_FILE = "addresses.json";
function isUtxoBasedCurrency(currencyId) {
    const family = (0, helpers_1.getFamilyByCurrencyId)(currencyId);
    if (!family)
        return false;
    return (0, helpers_1.isUTXOCompliant)(family) || family === "kaspa";
}
function getAddressCacheDir() {
    const dir = process.env[ENV_DIR]?.trim() || process.env[ENV_USERDATA_DIR]?.trim();
    return dir ? dir : null;
}
function getAddressCachePath() {
    const dir = getAddressCacheDir();
    return dir ? path_1.default.join(dir, exports.ADDRESS_CACHE_FILE) : null;
}
function readCacheFileAt(file) {
    if (!file)
        return null;
    try {
        return JSON.parse(fs_1.default.readFileSync(file, "utf-8"));
    }
    catch {
        return null;
    }
}
function matchEntry(entries, account) {
    const sameIndex = entries.filter(e => e.index === account.index);
    if (sameIndex.length <= 1 || account.derivationMode == null)
        return sameIndex[0];
    return sameIndex.find(e => (e.derivationMode ?? "") === account.derivationMode) ?? sameIndex[0];
}
function getCachedAddress(account) {
    if (account.currency.id.includes("/"))
        return null;
    if (isUtxoBasedCurrency(account.currency.id))
        return null;
    const entries = readCacheFileAt(getAddressCachePath())?.addresses?.[account.currency.id];
    const address = Array.isArray(entries) ? matchEntry(entries, account)?.address : undefined;
    return address ?? null;
}
function setCachedAddressEntry(cache, currencyId, entry) {
    const list = (cache.addresses[currencyId] ??= []);
    const existing = list.findIndex(e => e.index === entry.index && (e.derivationMode ?? "") === (entry.derivationMode ?? ""));
    if (existing === -1)
        list.push(entry);
    else
        list[existing] = entry;
    return cache;
}
//# sourceMappingURL=addressCache.js.map
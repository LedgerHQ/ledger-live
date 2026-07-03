"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeneratedUserdataDir = getGeneratedUserdataDir;
exports.hasGeneratedUserdata = hasGeneratedUserdata;
exports.applyGeneratedUserdata = applyGeneratedUserdata;
exports.getGeneratedAddress = getGeneratedAddress;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ENV_DIR = "E2E_GENERATED_USERDATA_DIR";
function getGeneratedUserdataDir() {
    const dir = process.env[ENV_DIR]?.trim();
    return dir ? dir : null;
}
function readJson(file) {
    try {
        return JSON.parse(fs_1.default.readFileSync(file, "utf-8"));
    }
    catch {
        return null;
    }
}
function loadCoinFile(account) {
    const dir = getGeneratedUserdataDir();
    if (!dir || account.currency.id.includes("/"))
        return null;
    return readJson(path_1.default.join(dir, `${account.currency.id}.json`));
}
function matchEntry(accounts, account) {
    const sameIndex = accounts.filter(e => e.data.index === account.index);
    if (sameIndex.length <= 1 || account.derivationMode == null)
        return sameIndex[0];
    return (sameIndex.find(e => (e.data.derivationMode ?? "") === account.derivationMode) ?? sameIndex[0]);
}
function mergeCryptoAssets(base, coin) {
    const tokens = coin?.data?.cryptoAssets?.tokens;
    if (!tokens?.length)
        return;
    base.data = base.data ?? {};
    const existing = base.data.cryptoAssets ?? {
        version: coin?.data?.cryptoAssets?.version,
        tokens: [],
    };
    const seen = new Set((existing.tokens ?? []).map(t => t.id));
    for (const token of tokens) {
        if (!seen.has(token.id))
            (existing.tokens ??= []).push(token);
    }
    base.data.cryptoAssets = existing;
}
function hasGeneratedUserdata(account) {
    if (account.currency.id.includes("/"))
        return false;
    const accounts = loadCoinFile(account)?.data?.accounts;
    return Array.isArray(accounts) && matchEntry(accounts, account) !== undefined;
}
function applyGeneratedUserdata(account, userdataPath) {
    if (account.currency.id.includes("/"))
        return false;
    const coin = loadCoinFile(account);
    const accounts = coin?.data?.accounts;
    const entry = Array.isArray(accounts) ? matchEntry(accounts, account) : undefined;
    if (userdataPath && entry) {
        const base = readJson(userdataPath) ?? {};
        base.data = base.data ?? {};
        if (typeof base.data.accounts !== "string") {
            base.data.accounts = base.data.accounts ?? [];
            if (!base.data.accounts.some(e => e?.data?.id === entry.data.id)) {
                base.data.accounts.push(entry);
            }
            mergeCryptoAssets(base, coin);
            fs_1.default.writeFileSync(userdataPath, JSON.stringify(base), "utf-8");
            return true;
        }
    }
    return false;
}
function getGeneratedAddress(account) {
    if (account.currency.id.includes("/"))
        return null;
    const coin = loadCoinFile(account);
    const accounts = coin?.data?.accounts;
    const address = Array.isArray(accounts) ? matchEntry(accounts, account)?.data.freshAddress : null;
    return address ?? null;
}
//# sourceMappingURL=generatedUserdata.js.map
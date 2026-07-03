"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeTokenCommand = exports.approveTokenCommand = exports.getTokenAllowanceCommand = exports.isTokenAllowanceSufficientCommand = exports.liveDataWithRecipientAddressCommand = exports.liveDataWithParentAddressCommand = exports.liveDataWithAddressCommand = exports.addEmptyAccountCommand = exports.liveDataCommand = exports.getAccountAddress = void 0;
exports.parseTokenAllowanceCliOutput = parseTokenAllowanceCliOutput;
exports.setDisableTransactionBroadcastEnv = setDisableTransactionBroadcastEnv;
const fs_1 = __importDefault(require("fs"));
const invariant_1 = __importDefault(require("invariant"));
const accountId_1 = require("@ledgerhq/ledger-wallet-framework/account/accountId");
const derivation_1 = require("@ledgerhq/ledger-wallet-framework/derivation");
const Currency_1 = require("./enum/Currency");
const runCli_1 = require("./runCli");
const concordium_1 = require("./families/concordium");
const evm_1 = require("./families/evm");
const index_1 = require("@ledgerhq/live-common/currencies/index");
const generatedUserdata_1 = require("./generatedUserdata");
const addressCache_1 = require("./addressCache");
const utxoAddressCache_1 = require("./utxoAddressCache");
const getAccountAddress = async (account) => {
    if (account.currency.id === Currency_1.Currency.HBAR.id) {
        (0, invariant_1.default)(account.address, "hedera: account address must be pre-set");
        return account.address;
    }
    if (account.currency.id === Currency_1.Currency.CCD_TESTNET.id) {
        const address = await (0, concordium_1.getCcdAccountAddress)(account);
        account.address = address;
        return address;
    }
    if (!(0, addressCache_1.isUtxoBasedCurrency)(account.currency.id)) {
        const cached = (0, addressCache_1.getCachedAddress)(account) ?? (0, generatedUserdata_1.getGeneratedAddress)(account);
        if (cached) {
            account.address = cached;
            return cached;
        }
    }
    else {
        const cached = (0, utxoAddressCache_1.getCachedUtxoAddress)(account);
        if (cached) {
            account.address = cached;
            return cached;
        }
    }
    const { address } = await (0, runCli_1.runCliGetAddress)({
        currency: account.currency.speculosApp.name,
        path: account.accountPath,
        derivationMode: account.derivationMode,
    });
    account.address = address;
    return address;
};
exports.getAccountAddress = getAccountAddress;
const liveDataCommand = (account, options) => {
    const cmd = async (userdataPath) => {
        if ((0, generatedUserdata_1.applyGeneratedUserdata)(account, userdataPath))
            return;
        await (0, runCli_1.runCliLiveData)({
            currency: options?.currency ?? account.currency.speculosApp.name,
            index: account.index,
            ...(options?.useScheme && account.derivationMode ? { scheme: account.derivationMode } : {}),
            add: true,
            appjson: userdataPath,
        });
    };
    cmd.canUseGeneratedUserdata = () => (0, generatedUserdata_1.hasGeneratedUserdata)(account);
    return cmd;
};
exports.liveDataCommand = liveDataCommand;
/**
 * Family-specific fields that must exist on an empty `AccountRaw` so the
 * desktop app's rehydration / portfolio code doesn't crash on undefined.
 */
function emptyFamilyExtras(family) {
    switch (family) {
        case "tron":
            return {
                tronResources: {
                    frozen: {},
                    delegatedFrozen: {},
                    unFrozen: { bandwidth: [], energy: [] },
                    legacyFrozen: {},
                    votes: [],
                    tronPower: 0,
                    energy: "0",
                    bandwidth: { freeUsed: "0", freeLimit: "0", gainedUsed: "0", gainedLimit: "0" },
                    unwithdrawnReward: "0",
                    cacheTransactionInfoById: {},
                },
            };
        default:
            return {};
    }
}
/**
 * Append an unactivated/empty account directly to userdata's `app.json`.
 *
 * Use this instead of {@link liveDataCommand} for empty-balance test accounts
 * at indices beyond the first empty one. The standard `liveData --index N`
 * relies on `bridge.scanAccounts`, whose gap-limit (`mandatoryEmptyAccountSkip`)
 * stops scanning after the first unused account, so an empty TRX_3 (index 2)
 * is never emitted when TRX_2 is also empty.
 *
 * This helper:
 *  1. Derives the receive address via Speculos at `account.accountPath`.
 *  2. Derives the device's `seedIdentifier` via Speculos at the currency's
 *     seed-identifier path.
 *  3. Writes a minimal `AccountRaw` stub into `data.accounts` of `app.json`.
 *
 * The stub is idempotent (no-op if an account with the same id already exists).
 */
const addEmptyAccountCommand = (account, options) => async (userdataPath) => {
    if (!userdataPath) {
        throw new Error("addEmptyAccountCommand requires a userdataPath");
    }
    const speculosCurrency = options?.currency ?? account.currency.speculosApp.name;
    const derivationMode = account.derivationMode ?? "";
    const cryptoCurrency = (0, index_1.getCryptoCurrencyById)(account.currency.id);
    // seedIdentifier = pubkey returned by getAddress at the currency-specific seed-id path
    // (matches `seedIdentifier = result.publicKey` in makeScanAccounts).
    const seedIdPath = (0, derivation_1.getSeedIdentifierDerivation)(cryptoCurrency, derivationMode);
    const { publicKey: seedIdentifier } = await (0, runCli_1.runCliGetAddress)({
        currency: speculosCurrency,
        path: seedIdPath,
        derivationMode,
    });
    const { address } = await (0, runCli_1.runCliGetAddress)({
        currency: speculosCurrency,
        path: account.accountPath,
        derivationMode,
    });
    const id = (0, accountId_1.encodeAccountId)({
        type: "js",
        version: "2",
        currencyId: account.currency.id,
        xpubOrAddress: address,
        derivationMode: derivationMode,
    });
    const stub = {
        id,
        seedIdentifier,
        name: account.accountName,
        starred: false,
        used: false,
        derivationMode,
        index: account.index,
        freshAddress: address,
        freshAddressPath: account.accountPath,
        blockHeight: 0,
        creationDate: new Date().toISOString(),
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        currencyId: account.currency.id,
        balance: "0",
        spendableBalance: "0",
        swapHistory: [],
    };
    // Family-specific extras required by serialization / portfolio rendering
    // on an unactivated account. Without these the desktop app crashes during
    // rehydration (e.g. Tron: `tronResources.bandwidth.freeLimit`).
    Object.assign(stub, emptyFamilyExtras(cryptoCurrency.family));
    const raw = JSON.parse(fs_1.default.readFileSync(userdataPath, "utf-8"));
    raw.data = raw.data ?? {};
    if (typeof raw.data.accounts === "string") {
        throw new Error("encrypted ledger live data is not supported");
    }
    raw.data.accounts = raw.data.accounts ?? [];
    const exists = raw.data.accounts.some((entry) => entry?.data?.id === id);
    if (!exists) {
        raw.data.accounts.push({ data: stub, version: 1 });
        fs_1.default.writeFileSync(userdataPath, JSON.stringify(raw), "utf-8");
    }
};
exports.addEmptyAccountCommand = addEmptyAccountCommand;
const liveDataWithAddressCommand = (account, options) => {
    const cmd = async (userdataPath) => {
        await (0, exports.liveDataCommand)(account, options)(userdataPath);
        const address = await (0, exports.getAccountAddress)(account);
        account.address = address;
        if ("parentAccount" in account && account.parentAccount) {
            account.parentAccount.address = address;
        }
        return address;
    };
    cmd.canUseGeneratedUserdata = () => (0, generatedUserdata_1.hasGeneratedUserdata)(account) && !(0, addressCache_1.isUtxoBasedCurrency)(account.currency.id);
    return cmd;
};
exports.liveDataWithAddressCommand = liveDataWithAddressCommand;
const liveDataWithParentAddressCommand = (liveDataAccount, accountToAssign) => {
    const cmd = async (userdataPath) => {
        if (!(0, generatedUserdata_1.applyGeneratedUserdata)(liveDataAccount, userdataPath)) {
            await (0, runCli_1.runCliLiveData)({
                currency: liveDataAccount.currency.speculosApp.name,
                index: liveDataAccount.index,
                add: true,
                appjson: userdataPath,
            });
        }
        if (!accountToAssign.parentAccount) {
            throw new Error("Parent account is required");
        }
        const address = await (0, exports.getAccountAddress)(accountToAssign.parentAccount);
        accountToAssign.address = address;
        return address;
    };
    cmd.canUseGeneratedUserdata = () => (0, generatedUserdata_1.hasGeneratedUserdata)(liveDataAccount) &&
        !!accountToAssign.parentAccount &&
        (0, generatedUserdata_1.hasGeneratedUserdata)(accountToAssign.parentAccount) &&
        !(0, addressCache_1.isUtxoBasedCurrency)(accountToAssign.parentAccount.currency.id);
    return cmd;
};
exports.liveDataWithParentAddressCommand = liveDataWithParentAddressCommand;
const liveDataWithRecipientAddressCommand = (tx, options) => {
    return async (userdataPath) => {
        if (!(0, generatedUserdata_1.applyGeneratedUserdata)(tx.accountToDebit, userdataPath)) {
            await (0, runCli_1.runCliLiveData)({
                currency: tx.accountToDebit.currency.speculosApp.name,
                index: tx.accountToDebit.index,
                ...(options?.useScheme && tx.accountToDebit.derivationMode
                    ? { scheme: tx.accountToDebit.derivationMode }
                    : {}),
                add: true,
                appjson: userdataPath,
            });
        }
        const address = await (0, exports.getAccountAddress)(tx.accountToCredit);
        tx.accountToCredit.address = address;
        tx.recipientAddress = address;
        return address;
    };
};
exports.liveDataWithRecipientAddressCommand = liveDataWithRecipientAddressCommand;
function parseTokenAllowanceCliOutput(output) {
    const jsonStart = output.indexOf("{");
    if (jsonStart === -1)
        throw new Error("No JSON found in tokenAllowance output:\n" + output);
    const rawParsed = JSON.parse(output.slice(jsonStart));
    if (typeof rawParsed !== "object" || rawParsed === null) {
        throw new Error("Invalid tokenAllowance JSON:\n" + output);
    }
    const allowanceField = Reflect.get(rawParsed, "allowance");
    if (typeof allowanceField !== "string") {
        throw new Error("Invalid tokenAllowance JSON (allowance):\n" + output);
    }
    const allowanceStr = allowanceField.trim();
    if (!/^\d+$/.test(allowanceStr)) {
        throw new Error("Invalid raw allowance in tokenAllowance:\n" + output);
    }
    const magnitudeField = Reflect.get(rawParsed, "unitMagnitude");
    if (typeof magnitudeField !== "number" ||
        !Number.isInteger(magnitudeField) ||
        magnitudeField < 0) {
        throw new Error("tokenAllowance JSON missing or invalid unitMagnitude (update CLI / ledger-live):\n" + output);
    }
    return { allowanceStr, unitMagnitude: magnitudeField };
}
/**
 * Returns current allowance as a decimal string if {@link minAmount}
 * is covered, otherwise `0`.
 */
const isTokenAllowanceSufficientCommand = async (account, spenderAddress, minAmount) => {
    const ownerAddress = account.parentAccount?.address ?? account.address;
    if (!ownerAddress)
        throw new Error("Token allowance check requires the main account address");
    const output = await (0, runCli_1.runCliGetTokenAllowance)({
        currency: account.currency.speculosApp.name,
        token: account.currency.id,
        spenderAddress,
        index: account.index,
        format: "json",
        ownerAddress,
    });
    const { allowanceStr, unitMagnitude } = parseTokenAllowanceCliOutput(output);
    const smallestUnit = { name: "smallest", code: "", magnitude: unitMagnitude };
    const minInSmallestUnit = (0, index_1.parseCurrencyUnit)(smallestUnit, minAmount);
    const minStr = minInSmallestUnit.toFixed(0);
    const allowanceBi = BigInt(allowanceStr);
    const minBi = BigInt(minStr);
    if (allowanceBi >= minBi)
        return allowanceStr;
    return 0;
};
exports.isTokenAllowanceSufficientCommand = isTokenAllowanceSufficientCommand;
/**
 * Returns the raw on-chain ERC-20 allowance as a decimal string in smallest
 * units. Use when an exact-value assertion is needed (e.g. assert allowance
 * is exactly zero after a revoke). Use {@link isTokenAllowanceSufficientCommand}
 * when only a threshold check is needed.
 */
const getTokenAllowanceCommand = async (account, spenderAddress) => {
    const ownerAddress = account.parentAccount?.address ?? account.address;
    if (!ownerAddress)
        throw new Error("Token allowance check requires the main account address");
    const output = await (0, runCli_1.runCliGetTokenAllowance)({
        currency: account.currency.speculosApp.name,
        token: account.currency.id,
        spenderAddress,
        index: account.index,
        format: "json",
        ownerAddress,
    });
    const { allowanceStr } = parseTokenAllowanceCliOutput(output);
    return allowanceStr;
};
exports.getTokenAllowanceCommand = getTokenAllowanceCommand;
/**
 * Runs ledger-live CLI token approval with Speculos device confirmation, managing
 * `DISABLE_TRANSACTION_BROADCAST` around the CLI call.
 */
const approveTokenCommand = async (account, spender, approveAmount) => {
    const original = setDisableTransactionBroadcastEnv("0");
    const result = (0, runCli_1.runCliTokenApproval)({
        currency: account.currency.speculosApp.name,
        index: account.index,
        spender,
        token: account.currency.id,
        mode: "approve",
        approveAmount,
        waitConfirmation: true,
    });
    try {
        await (0, evm_1.approveToken)();
    }
    finally {
        setDisableTransactionBroadcastEnv(original);
    }
    return await result;
};
exports.approveTokenCommand = approveTokenCommand;
const revokeTokenCommand = async (account, spender) => {
    const original = setDisableTransactionBroadcastEnv("0");
    const result = (0, runCli_1.runCliTokenApproval)({
        currency: account.currency.speculosApp.name,
        index: account.index,
        spender,
        token: account.currency.id,
        mode: "revokeApproval",
        waitConfirmation: true,
    });
    try {
        await (0, evm_1.approveToken)();
    }
    finally {
        setDisableTransactionBroadcastEnv(original);
    }
    return await result;
};
exports.revokeTokenCommand = revokeTokenCommand;
const ENV_KEY = "DISABLE_TRANSACTION_BROADCAST";
function setDisableTransactionBroadcastEnv(value) {
    const previous = process.env[ENV_KEY];
    if (value === undefined) {
        delete process.env[ENV_KEY];
    }
    else {
        process.env[ENV_KEY] = value;
    }
    return previous;
}
//# sourceMappingURL=cliCommandsUtils.js.map
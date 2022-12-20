import { encodeAccountId } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import { getAccount, getOperations } from "./api";
import { ZilliqaAccount } from "./types";

const getAccountShape: GetAccountShape = async (info) => {
	console.log("ZILLIQA: getAccountShape.");
	console.log(info);
	const { address, initialAccount, currency, derivationMode, rest } = info;
	const account = initialAccount as ZilliqaAccount;

	let publicKey: undefined | string;

	if (rest && rest.publicKey) {
		publicKey = rest.publicKey;
	} else if (
		account &&
		account.zilliqaResources &&
		account.zilliqaResources.publicKey
	) {
		// UI has a zilliqaResources attribute
		publicKey = account.zilliqaResources.publicKey;
	} else {
		throw new Error("Account Info does not contain public key.");
	}

	const accountId = encodeAccountId({
		type: "js",
		version: "2",
		currencyId: currency.id,
		xpubOrAddress: address,
		derivationMode,
	});
	const oldOperations = initialAccount?.operations || [];
	// Needed for incremental synchronisation
	const startAt = 0;

	// get the current account balance state depending your api implementation
	const { blockHeight, balance, nonce } = await getAccount(address);
	// Merge new operations with the previously synced ones
	const newOperations = await getOperations(accountId, address, startAt);
	const operations = mergeOps(oldOperations, newOperations);
	const shape = {
		id: accountId,
		balance,
		spendableBalance: balance,
		operationsCount: operations.length,
		blockHeight,
		zilliqaResources: {
			publicKey,
			nonce,
		},
	};

	return { ...shape, operations };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });

import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import {
	ZilliqaOperation,
	ZilliqaExtraTxInfo,
	ZilliqaPreloadData,
	ZilliqaAccount,
} from "./types";
import type { Unit } from "@ledgerhq/types-cryptoassets";

function formatOperationSpecifics(
	op: ZilliqaOperation,
	unit: Unit | null | undefined
): string {
	return "TODO: Implement";
}

export function formatAccountSpecifics(account: ZilliqaAccount): string {
	return "TODO: Implement";
}

export function fromOperationExtraRaw(
	extra: Record<string, any> | null | undefined
): ZilliqaExtraTxInfo | Record<string, any> | null | undefined {
	// TODO: Implement
	return null;
}
export function toOperationExtraRaw(
	extra: Record<string, any> | null | undefined
): ZilliqaExtraTxInfo | Record<string, any> | null | undefined {
	// TODO: Implement
	return null;
}
export default {
	formatAccountSpecifics,
	formatOperationSpecifics,
	fromOperationExtraRaw,
	toOperationExtraRaw,
};

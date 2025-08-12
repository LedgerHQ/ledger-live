import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import type { OperationCommon } from "./buildSubAccounts";

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(v => typeof v === "string");
}

function getStatusFromDetails(op: OperationCommon): string | undefined {
    // older cached ops may carry a details.status string
    const details = (op as unknown as { details?: { status?: string } } | undefined)?.details;
    return details?.status;
}

function formatTransaction(op: OperationCommon, accountAddress: string): OperationCommon {
    const senders = isStringArray(op.senders) ? op.senders : [];
    const recipients = isStringArray(op.recipients) ? op.recipients : [];
    const isOut = senders.includes(accountAddress);
    const isIn = recipients.includes(accountAddress);
    const valueBN = new BigNumber(op.value?.toString() || "0");

    if ((isOut && isIn) || valueBN.eq(0)) {
        return { ...op, type: "FEES" as Operation["type"] };
    }

    return { ...op, type: isOut ? "OUT" : isIn ? "IN" : "OUT" as Operation["type"] };
}

function formatOperation(op: OperationCommon, type: Operation["type"]): OperationCommon {
    return { ...op, type };
}

/**
 * Normalize legacy operation types to the generic ones used by the new bridge.
 * if already normalized, returns the operation unchanged reference when possible.
 */
export function normalizeLegacyOperation(
    op: OperationCommon,
    accountAddress: string,
): OperationCommon {
    const originalType = String(op.type);
    let normalizedType: Operation["type"] = op.type as Operation["type"];

    switch (originalType) {
        case "transaction":
            return formatTransaction(op, accountAddress);
        case "reveal":
            return formatOperation(op, "REVEAL");
        // see how to deal with these twwo since near uses stake and unstake.....
        case "STAKE":
            return formatOperation(op, "DELEGATE");
        case "UNSTAKE":
            return formatOperation(op, "UNDELEGATE");
        default:
            break;
    }

    const status = getStatusFromDetails(op);
    const hasFailed = status === "failed" || status === "backtracked";

    if (normalizedType === (op.type as Operation["type"]) && op.hasFailed === hasFailed) {
        return op;
    }

    return {
        ...op,
        type: normalizedType,
        hasFailed,
    } as OperationCommon;
}

import type { Operation as CoreOperation } from "@ledgerhq/coin-module-framework/api/types";
import type { OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAccountRawAssignHooks } from "../../bridge/generic-coin-framework/accountRawAssign";
import { adaptCoreOperationToLiveOperation } from "../../bridge/generic-coin-framework/utils";

const coreOperation = {
  id: "TX",
  type: "IN",
  value: 1000n,
  asset: { type: "native" },
  senders: ["SENDER"],
  recipients: ["RECIPIENT"],
  tx: {
    hash: "TX",
    block: { height: 1, hash: "", time: new Date(0) },
    fees: 1000n,
    date: new Date(0),
    failed: false,
  },
  details: { memo: "hello", familyExtra: { rewards: "800", assetId: "123" } },
} as CoreOperation;

describe("algorand operation extra", () => {
  it("keeps the note as text and revives historical rewards on a synced operation", async () => {
    const { fromOperationExtraRaw } = await getAccountRawAssignHooks("algorand");

    const { extra } = adaptCoreOperationToLiveOperation("accountId", coreOperation, extraRaw =>
      fromOperationExtraRaw!(extraRaw),
    );

    expect(extra).toMatchObject({ memo: "hello", assetId: "123", rewards: new BigNumber(800) });
  });

  it("round trips rewards and unknown keys through storage", async () => {
    const { toOperationExtraRaw, fromOperationExtraRaw } =
      await getAccountRawAssignHooks("algorand");
    const extra = { rewards: new BigNumber(800), memo: "hello", unknown: "kept" } as OperationExtra;

    const raw = JSON.parse(JSON.stringify(toOperationExtraRaw!(extra))) as OperationExtraRaw;

    expect(raw).toEqual({ rewards: "800", memo: "hello", unknown: "kept" });
    expect(fromOperationExtraRaw!(raw)).toEqual(extra);
  });
});

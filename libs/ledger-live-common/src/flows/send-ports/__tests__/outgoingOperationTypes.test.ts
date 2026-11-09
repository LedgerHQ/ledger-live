import { SEND_OUTGOING_OPERATION_TYPES } from "@features/platform-send-flow";
import {
  OPERATION_TYPE_OUT_FAMILY,
  OPERATION_TYPE_STAKE_FAMILY,
} from "@ledgerhq/ledger-wallet-framework/operation";

describe("SEND_OUTGOING_OPERATION_TYPES", () => {
  it("lists exactly the framework's outgoing and staking operation types", () => {
    const framework = new Set<string>([
      ...OPERATION_TYPE_OUT_FAMILY,
      ...OPERATION_TYPE_STAKE_FAMILY,
    ]);
    expect([...SEND_OUTGOING_OPERATION_TYPES].sort()).toEqual([...framework].sort());
  });
});

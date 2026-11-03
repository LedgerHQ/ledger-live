import { BigNumber } from "bignumber.js";
import type { TokenAccount, TokenAccountRaw } from "@ledgerhq/types-live";
import accountRawAssign from "./accountRawAssign";
import type { XrpTokenAccount, XrpTokenAccountRaw } from "./types";

function roundTrip(xrpResources: XrpTokenAccount["xrpResources"]) {
  const raw = {} as TokenAccountRaw;
  accountRawAssign.assignToTokenAccountRaw({ xrpResources } as XrpTokenAccount, raw);

  const revived = {} as TokenAccount;
  accountRawAssign.assignFromTokenAccountRaw(JSON.parse(JSON.stringify(raw)), revived);

  return { raw: raw as XrpTokenAccountRaw, revived: revived as XrpTokenAccount };
}

describe("xrp accountRawAssign", () => {
  it("keeps an IOU's limit, as a string in the raw account, and its rippling", () => {
    const limit = new BigNumber("1e47");

    const { raw, revived } = roundTrip({ isLocked: true, limit, isRippling: true });

    expect(raw.xrpResources).toEqual({ isLocked: true, limit: limit.toFixed(), isRippling: true });
    expect(revived.xrpResources?.isLocked).toBe(true);
    expect(revived.xrpResources?.isRippling).toBe(true);
    expect(revived.xrpResources?.limit?.isEqualTo(limit)).toBe(true);
  });

  it("keeps an MPT without a limit", () => {
    const { revived } = roundTrip({ isLocked: false });

    expect(revived.xrpResources).toEqual({ isLocked: false });
  });

  it("writes nothing for a token account without resources", () => {
    const { raw, revived } = roundTrip(undefined);

    expect(raw).not.toHaveProperty("xrpResources");
    expect(revived).not.toHaveProperty("xrpResources");
  });
});

import { WC_ID } from "@ledgerhq/live-common/wallet-api/constants";
import { getSignatureSourceFlow } from "./getSignatureSourceFlow";

describe("getSignatureSourceFlow", () => {
  it("tracks the Wallet Connect live app as wallet_connect", () => {
    expect(getSignatureSourceFlow(WC_ID)).toBe("wallet_connect");
  });

  it("tracks any other live app as wallet_api", () => {
    expect(getSignatureSourceFlow("swap-live-app-aws")).toBe("wallet_api");
  });
});

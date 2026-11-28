import { getSignatureSourceFlow } from "../getSignatureSourceFlow";

const WALLET_CONNECT_MANIFEST_ID = "ledger-wallet-connect";

describe("getSignatureSourceFlow", () => {
  it("returns wallet_connect for the Wallet Connect live app", () => {
    expect(getSignatureSourceFlow(WALLET_CONNECT_MANIFEST_ID, WALLET_CONNECT_MANIFEST_ID)).toBe(
      "wallet_connect",
    );
  });

  it("returns wallet_api for any other live app", () => {
    expect(getSignatureSourceFlow("swap-live-app", WALLET_CONNECT_MANIFEST_ID)).toBe("wallet_api");
  });
});

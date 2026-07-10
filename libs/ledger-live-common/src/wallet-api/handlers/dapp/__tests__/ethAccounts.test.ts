import { handleEthAccounts } from "../ethAccounts";
import type { DappMessageContext } from "../types";

describe("handleEthAccounts", () => {
  it("responds with the signer account's fresh address in an array", () => {
    const postMessage = jest.fn();
    const context = {
      signerAccount: { freshAddress: "0xSIGNER" },
      postMessage,
    } as unknown as DappMessageContext;

    handleEthAccounts(context, { jsonrpc: "2.0", method: "eth_accounts", id: 1 });

    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({ id: 1, jsonrpc: "2.0", result: ["0xSIGNER"] }),
    );
  });
});

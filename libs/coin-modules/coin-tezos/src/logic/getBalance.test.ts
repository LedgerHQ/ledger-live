import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import coinConfig, { TezosCoinConfig } from "../config";
import { getBalance } from "./getBalance";

describe("getBalance", () => {
  const mockServer = setupServer();
  coinConfig.setCoinConfig(
    () =>
      ({
        status: { type: "active" },
        explorer: { url: "http://tezos.explorer.com" },
      }) as unknown as TezosCoinConfig,
  );
  it("gets the balance of a Tezos account", async () => {
    mockServer.listen({ onUnhandledRequest: "error" });
    mockServer.use(
      http.get("http://tezos.explorer.com/v1/accounts/tz1WvvbEGpBXGeTVbLiR6DYBe1izmgiYuZbq", () =>
        HttpResponse.json({ type: "empty" }),
      ),
      http.get("http://tezos.explorer.com/v1/accounts/tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oSM8", () =>
        HttpResponse.json({ type: "user", balance: 25 }),
      ),
    );

    expect(await getBalance("tz1WvvbEGpBXGeTVbLiR6DYBe1izmgiYuZbq")).toEqual(BigInt(-1));
    expect(await getBalance("tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oSM8")).toEqual(BigInt(25));
  });
});

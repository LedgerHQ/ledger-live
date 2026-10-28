import { ALL_ACCOUNTS, buildRegistration } from "./registration";

const evm = { accountUUID: "uuid-evm", label: "ethereum 0xabc", registration: '{"type":"evm"}' };
const bitcoin = {
  accountUUID: "uuid-btc",
  label: "bitcoin xpub",
  registration: '{"type":"auto_derive"}',
};

describe("buildRegistration", () => {
  it("registers every account, and nothing for an account that is not there", () => {
    expect(JSON.parse(buildRegistration([evm, bitcoin], ALL_ACCOUNTS).payload)).toEqual([
      { type: "evm" },
      { type: "auto_derive" },
    ]);
    expect(buildRegistration([evm], "unknown")).toEqual({ count: 0, payload: "[]" });
  });
});

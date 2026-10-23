import { ALL_ACCOUNTS, buildRegistration } from "./registration";

const evm = { accountUUID: "uuid-evm", label: "ethereum 0xabc", registration: '{"type":"evm"}' };
const bitcoin = {
  accountUUID: "uuid-btc",
  label: "bitcoin xpub",
  registration: '{"type":"auto_derive"}',
};

describe("buildRegistration", () => {
  it("registers every account when none is chosen", () => {
    const { count, payload } = buildRegistration([evm, bitcoin], ALL_ACCOUNTS);
    expect(count).toBe(2);
    expect(JSON.parse(payload)).toEqual([{ type: "evm" }, { type: "auto_derive" }]);
  });

  it("registers only the chosen account", () => {
    const { count, payload } = buildRegistration([evm, bitcoin], "uuid-btc");
    expect(count).toBe(1);
    expect(JSON.parse(payload)).toEqual([{ type: "auto_derive" }]);
  });

  it("registers nothing for an account that is not there", () => {
    expect(buildRegistration([evm], "unknown")).toEqual({ count: 0, payload: "[]" });
  });
});

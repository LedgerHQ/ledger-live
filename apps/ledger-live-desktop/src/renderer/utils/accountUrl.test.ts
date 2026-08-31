import { computeAccountAlias } from "@domain/entity-account-alias";
import { getAccountUrl } from "./accountUrl";

const ETH_ACCOUNT_ID = "js:2:ethereum:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:";
const TRON_ACCOUNT_ID = "js:2:tron:TDyq9kiahZXthXHrpQNLyyRSj75kEZuYZQ:";

describe("getAccountUrl", () => {
  it("should construct URL for main account without parent", () => {
    expect(getAccountUrl(ETH_ACCOUNT_ID)).toBe(`/account/${computeAccountAlias(ETH_ACCOUNT_ID)}`);
  });

  it("should construct URL for token account with parent", () => {
    const tokenAccountId = `${ETH_ACCOUNT_ID}+ethereum%2Ferc20%2Fusd__coin`;
    expect(getAccountUrl(tokenAccountId, ETH_ACCOUNT_ID)).toBe(
      `/account/${computeAccountAlias(ETH_ACCOUNT_ID)}/${computeAccountAlias(tokenAccountId)}`,
    );
  });

  it("should leak neither address nor token id", () => {
    const tokenAccountId = `${TRON_ACCOUNT_ID}+tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t`;
    const url = getAccountUrl(tokenAccountId, TRON_ACCOUNT_ID);
    expect(url).not.toContain("TDyq9kiahZXthXHrpQNLyyRSj75kEZuYZQ");
    expect(url).not.toContain("trc20");
    expect(url.split("/")).toHaveLength(4);
  });

  it("should be stable across calls", () => {
    expect(getAccountUrl(ETH_ACCOUNT_ID)).toBe(getAccountUrl(ETH_ACCOUNT_ID));
  });
});

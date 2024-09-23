import BigNumber from "bignumber.js";
import { fetchCoinDetailsForAccount, fetchNetworkInfo, getKadenaPactURL } from "../../api/network";
import { setCoinConfig } from "../../config";
import { API_KADENA_ENDPOINT } from "../fixtures/common.fixtures";

describe("network", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: {
        type: "active",
      },
      infra: {
        API_KADENA_ENDPOINT,
      },
    }));
  });

  test("fetch balances", async () => {
    const address = "k:8ae62e33629660c10e3faf0fe83b675ff5186116bd29a29fe71179480bf4ae76";
    const networkInfo = await fetchNetworkInfo();
    const balanceResp = await fetchCoinDetailsForAccount(address, networkInfo.nodeChains);

    let totalBalance = new BigNumber(0);
    for (const balance of Object.values(balanceResp)) {
      totalBalance = totalBalance.plus(balance);
    }

    expect(totalBalance.toNumber()).toBeGreaterThan(0);
  });

  test("fetch network info", async () => {
    const info = await fetchNetworkInfo();
    expect(info).toBeDefined();
  });

  test("get kadena pact url", () => {
    const url = getKadenaPactURL("0");
    expect(url).toBe(`${API_KADENA_ENDPOINT}/chainweb/0.0/testnet04/chain/0/pact`);
  });
});

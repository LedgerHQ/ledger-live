import BigNumber from "bignumber.js";
import { fetchCoinDetailsForAccount, fetchNetworkInfo, getKadenaPactURL } from "./network";

// Define the mock base URL for the TON API
export const API_KADENA_ENDPOINT = "https://estats.testnet.chainweb.com";

test("fetch balances", async () => {
  const address = "k:8ae62e33629660c10e3faf0fe83b675ff5186116bd29a29fe71179480bf4ae76";
  const networkInfo = await fetchNetworkInfo();
  const balanceResp = await fetchCoinDetailsForAccount(address, networkInfo.nodeChains);

  let totalBalance = new BigNumber(0);
  for (const balance of Object.values(balanceResp)) {
    totalBalance = totalBalance.plus(balance);
  }

  // eslint-disable-next-line no-console
  console.log(totalBalance.toString(), balanceResp);
  expect(totalBalance.toNumber()).toBeGreaterThan(0);
});

test("fetch network info", async () => {
  const info = await fetchNetworkInfo();
  // eslint-disable-next-line no-console
  console.log(info);
  expect(info).toBeDefined();
});

test("get kadena pact url", () => {
  const url = getKadenaPactURL("0");
  expect(url).toBe(`${API_KADENA_ENDPOINT}/chainweb/0.0/testnet04/chain/0/pact`);
});

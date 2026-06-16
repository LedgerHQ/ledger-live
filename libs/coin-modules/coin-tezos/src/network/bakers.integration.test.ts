import coinConfig, { TezosCoinConfig } from "../config";
import { listBakers } from "../network/bakers";
import whitelist from "../network/bakers.whitelist-default";
import { mockConfig } from "../test/config";

describe("tezos bakers", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig((): TezosCoinConfig => mockConfig as TezosCoinConfig);
  });

  test("atleast 10 whitelisted bakers are online", async () => {
    const bakers = await listBakers(whitelist);
    const retrievedAddresses = bakers.map(o => o.address);
    let available = 0;
    for (const whitelisted of whitelist) {
      if (retrievedAddresses.includes(whitelisted)) {
        available++;
      } else {
        console.warn(`Baker ${whitelisted} no longer online !`);
      }
    }
    expect(available).toBeGreaterThan(10);
  });
});

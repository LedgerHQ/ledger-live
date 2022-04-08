import { fromAccountRaw } from "../../account";
import { accountTZrevealedDelegating } from "./test-dataset";
import { loadAccountDelegation, listBakers } from "./bakers";
import whitelist from "./bakers.whitelist-default";
export default () => {
  describe("tezos bakers", () => {
    // FIXME Flaky test that will fail every time a Tezos baker is discontinued
    test("getting the bakers", async () => {
      const list = await listBakers(whitelist);
      expect(list.map((o) => o.address)).toEqual(whitelist);
    });
    // TODO we'll need two accounts to test diff cases
    test("load account baker info", async () => {
      const account = fromAccountRaw(accountTZrevealedDelegating);
      const delegation = await loadAccountDelegation(account);
      expect(delegation).toBe(null);
    });
  });
};

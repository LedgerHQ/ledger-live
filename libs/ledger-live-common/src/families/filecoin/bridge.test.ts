import { setup } from "../../__tests__/test-helpers/libcore-setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import dataset from "./test-dataset";

import { getAccountBridge } from "../../bridge";
import {
  decodeAccountId,
  encodeAccountId,
  fromAccountRaw,
} from "../../account";
import { InvalidAddress } from "@ledgerhq/errors";

setup("filecoin");
testBridge("filecoin", dataset);

describe("estimateMaxSpendable", () => {
  test("it should failed on invalid recipient", async () => {
    const accounts = dataset.currencies["filecoin"].accounts || [];
    const accountData = accounts[0];

    const account = fromAccountRaw({
      ...accountData.raw,
      id: encodeAccountId({
        ...decodeAccountId(accountData.raw.id),
        type: dataset.implementations[0],
      }),
    });

    const accountBridge = getAccountBridge(account);
    const estimate = async () => {
      await accountBridge.estimateMaxSpendable({
        account,
        transaction: { recipient: "notavalidrecipient" },
      });
    };

    await expect(estimate).rejects.toThrowError(new InvalidAddress());
  });
});

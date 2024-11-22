import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { dataset } from "@ledgerhq/coin-filecoin/test/index";

testBridge(dataset);

// describe("estimateMaxSpendable", () => {
//   test("it should failed on invalid recipient", async () => {
//     const accounts = dataset.currencies["filecoin"].accounts || [];
//     const accountData = accounts[0];

//     const account = fromAccountRaw({
//       ...accountData.raw,
//       id: encodeAccountId({
//         ...decodeAccountId(accountData.raw.id),
//         type: dataset.implementations[0],
//       }),
//     });

//     const accountBridge = getAccountBridge(account);
//     const estimate = async () => {
//       await accountBridge.estimateMaxSpendable({
//         account,
//         transaction: { recipient: "notavalidrecipient" },
//       });
//     };

//     await expect(estimate).rejects.toThrowError(new InvalidAddress());
//   });
// });

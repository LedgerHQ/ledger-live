// @flow
import { getFiatUnit } from "@ledgerhq/currencies";
import { createAccountModel } from "../../models/account";
import { genAccount } from "../../mock/account";

test("for current accountModel, decode(encode(...)) is pseudo-identity", () => {
  const {version,encode,decode} = createAccountModel();
  const account = genAccount("model1");
  const accountMirror = decode(encode(account));
  // the encode method is allowed to chunk the potentially big operations array
  account.operations.splice(accountMirror.operations.length);
  expect(accountMirror).toMatchObject(account);
});

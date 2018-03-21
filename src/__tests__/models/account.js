// @flow
import { getFiatUnit } from "@ledgerhq/currencies";
import AccountModel from "../../models/account";
import { genAccount } from "../../mock/account";

const { encode, decode } = AccountModel;

test("for current accountModel, decode(encode(...)) is pseudo-identity", () => {
  const account = genAccount("model1");
  const model = { data: account, version: AccountModel.version };
  const modelMirror = decode(encode(model));
  // the encode method is allowed to chunk the potentially big operations array
  model.data.operations.splice(modelMirror.data.operations.length);
  expect(modelMirror).toMatchObject(model);
});

// @flow
import React from "react";
import sample from "lodash/sample";
import { genAccount } from "@ledgerhq/live-common/lib/mock/account";
import GreyButton from "./GreyButton";
import { accountModel } from "../reducers/accounts";
import db from "../db";
import { withReboot } from "../context/Reboot";
import { listCryptoCurrencies } from "../cryptocurrencies";

async function injectMockAccountsInDB(count) {
  await db.save("accounts", {
    active: Array(count)
      .fill(null)
      .map(() =>
        accountModel.encode(
          genAccount(String(Math.random()), {
            currency: sample(listCryptoCurrencies()),
          }),
        ),
      ),
  });
}

const GenerateMockAccountsButton = ({
  title,
  reboot,
  ...rest
}: {
  title: string,
  reboot: *,
}) => (
  <GreyButton
    {...rest}
    title={title}
    onPress={async () => {
      await injectMockAccountsInDB(12);
      reboot();
    }}
  />
);

export default withReboot(GenerateMockAccountsButton);

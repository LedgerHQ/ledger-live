// @flow
import React from "react";
import sample from "lodash/sample";
import { genAccount } from "@ledgerhq/live-common/lib/mock/account";
import SettingsRow from "../../../components/SettingsRow";
import accountModel from "../../../logic/accountModel";
import db from "../../../db";
import { withReboot } from "../../../context/Reboot";
import { listCryptoCurrencies } from "../../../cryptocurrencies";

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
  reboot,
  count,
  title,
}: {
  title: string,
  count: number,
  reboot: *,
}) => (
  <SettingsRow
    title={title}
    onPress={async () => {
      await injectMockAccountsInDB(count);
      reboot();
    }}
  />
);

export default withReboot(GenerateMockAccountsButton);

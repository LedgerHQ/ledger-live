import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button as ButtonRaw } from "@ledgerhq/react-ui";
import accountModel from "~/helpers/accountModel";
import { replaceAccounts } from "~/renderer/actions/accounts";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import mockedData from "../../../../../../tests/userdata/bot-accounts.json";
import { Account } from "~/../../../libs/ledgerjs/packages/types-live/lib";

const Button = styled(ButtonRaw)`
  border-radius: 4px;
`;

function useImportMockedAccounts() {
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const mockedAccounts = useMemo(() => {
    const res = mockedData.data.accounts.reduce<{
      [key: string]: Account;
    }>(
      (prev, a) =>
        prev[a.data.currencyId]
          ? prev
          : { ...prev, [a.data.currencyId]: accountModel.decode(a as any) },
      {},
    );
    return Object.values(res);
  }, []);

  return useCallback(() => {
    dispatch(replaceAccounts([...accounts, ...mockedAccounts]));
  }, [dispatch, accounts, mockedAccounts]);
}

export function MockedAccounts() {
  const { t } = useTranslation();
  const importMockedAccounts = useImportMockedAccounts();

  return (
    <Row
      title={t("settings.developer.mockedAccounts.title")}
      desc={t("settings.developer.mockedAccounts.desc")}
    >
      <Button
        variant="color"
        size="small"
        onClick={importMockedAccounts}
        data-test-id="settings-import-mocked-accounts"
      >
        {t("settings.developer.mockedAccounts.cta")}
      </Button>
    </Row>
  );
}

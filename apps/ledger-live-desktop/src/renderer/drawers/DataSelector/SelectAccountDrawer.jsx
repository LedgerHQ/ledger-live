// @flow

import React, { useCallback, memo } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/live-common/types/index";

import Text from "~/renderer/components/Text";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { AccountList } from "./AccountList";

const AccountSelectorDrawerContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const SelectorContent = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
`;

const HeaderContainer: ThemedComponent<any> = styled.div`
  padding: 40px 0px 32px 0px;
  flex: 0 1 auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

type SelectAccountDrawerProps = {
  currency: CryptoCurrency | TokenCurrency,
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void,
};

const SelectAccountDrawer = ({ currency, onAccountSelected }: SelectAccountDrawerProps) => {
  const { t } = useTranslation();

  const handleAccountSelect = useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      onAccountSelected(account, parentAccount);
    },
    [onAccountSelected],
  );

  return (
    <AccountSelectorDrawerContainer>
      <HeaderContainer>
        <Text
          ff="Inter|Medium"
          color="palette.text.shade100"
          fontSize="24px"
          style={{ textTransform: "uppercase" }}
        >
          {t("drawers.selectAccount.title")}
        </Text>
      </HeaderContainer>
      <SelectorContent>
        <AccountList currency={currency} onAccountSelect={handleAccountSelect} />
      </SelectorContent>
    </AccountSelectorDrawerContainer>
  );
};

export default memo<SelectAccountDrawerProps>(SelectAccountDrawer);

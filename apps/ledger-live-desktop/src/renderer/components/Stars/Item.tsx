import React, { useCallback } from "react";
import { useNavigate } from "react-router";
import styled from "styled-components";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { AccountLike } from "@ledgerhq/types-live";
import Hide from "~/renderer/components/MainSideBar/Hide";
import FormattedVal from "~/renderer/components/FormattedVal";
import Box from "~/renderer/components/Box";
import Ellipsis from "~/renderer/components/Ellipsis";
import ParentCryptoCurrencyIcon from "~/renderer/components/ParentCryptoCurrencyIcon";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useAccountName } from "~/renderer/reducers/wallet";
const ParentCryptoCurrencyIconWrapper = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ItemWrapper = styled.div.attrs<{
  active: boolean;
  collapsed?: boolean;
}>(p => ({
  style: {
    backgroundColor: p.active ? p.theme.colors.opacityDefault.c10 : p.theme.colors.background.card,
  },
}))<{
  active: boolean;
  collapsed?: boolean;
}>`
  flex: 1;
  align-items: center;
  display: flex;
  padding: 6px 12px;
  width: ${p => (p.collapsed ? "auto" : "200px")};
  justify-content: ${p => (p.collapsed ? "center" : "flex-start")};
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  margin: 2px 0px;
  color: ${p => (p.active ? p.theme.colors.neutral.c100 : p.theme.colors.neutral.c80)};

  &:hover {
    color: ${p => p.theme.colors.neutral.c100};
  }
`;
type Props = {
  account: AccountLike;
  index: number;
  pathname: string;
  collapsed?: boolean;
};
const Item = ({ account, pathname, collapsed }: Props) => {
  const accountName = useAccountName(account);
  const navigate = useNavigate();
  const active = pathname.endsWith(account.id);
  const onAccountClick = useCallback(() => {
    const parentAccountId = account.type !== "Account" ? account.parentId : undefined;
    setTrackingSource("starred account item");
    navigate(
      parentAccountId ? `/account/${parentAccountId}/${account.id}` : `/account/${account.id}`,
    );
  }, [account, navigate]);
  const unit = useAccountUnit(account);
  return (
    <ItemWrapper active={active} collapsed={collapsed} onClick={onAccountClick}>
      <Box horizontal ff="Inter|SemiBold" flex={1} flow={3} alignItems="center">
        <ParentCryptoCurrencyIconWrapper>
          <ParentCryptoCurrencyIcon currency={getAccountCurrency(account)} />
        </ParentCryptoCurrencyIconWrapper>
        <Box flex={1}>
          <Hide visible={!collapsed}>
            <Ellipsis>{accountName}</Ellipsis>
            <FormattedVal
              alwaysShowSign={false}
              animateTicker={false}
              ellipsis
              color="neutral.c70"
              unit={unit}
              showCode
              val={account.balance}
            />
          </Hide>
        </Box>
      </Box>
    </ItemWrapper>
  );
};
export default Item;

import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCurrencyColor } from "~/renderer/getCurrencyColor";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import Ellipsis from "~/renderer/components/Ellipsis";
import ParentCryptoCurrencyIcon from "~/renderer/components/ParentCryptoCurrencyIcon";
import Box from "~/renderer/components/Box";
import AccountContextMenu from "~/renderer/components/ContextMenu/AccountContextMenu";
import { accountsSelector } from "~/renderer/reducers/accounts";
import Bar from "~/renderer/screens/dashboard/AssetDistribution/Bar";
import ToolTip from "~/renderer/components/Tooltip";
import useTheme from "~/renderer/hooks/useTheme";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useAccountName, useMaybeAccountName } from "~/renderer/reducers/wallet";

export type AccountDistributionItem = {
  account: AccountLike;
  distribution: number;
  // % of the total (normalized in 0-1)
  amount: BigNumber;
  currency: CryptoCurrency | TokenCurrency;
};
type Props = {
  item: AccountDistributionItem;
  isVisible: boolean;
};
export default function Row({
  item: { currency, amount, distribution, account },
  isVisible,
}: Props) {
  const unit = useAccountUnit(account);
  const accounts = useSelector(accountsSelector);
  const theme = useTheme();
  const history = useHistory();
  const onAccountClick = useCallback(
    (account: Account | TokenAccount) => {
      setTrackingSource("account allocation");
      history.push({
        pathname:
          account.type !== "Account"
            ? `/account/${account.parentId}/${account.id}`
            : `/account/${account.id}`,
      });
    },
    [history],
  );
  const parentAccount =
    account.type !== "Account" ? accounts.find(a => a.id === account.parentId) : null;
  const color = useCurrencyColor(currency, theme.colors.palette.background.paper);
  const displayName = useAccountName(account);
  const parentDisplayName = useMaybeAccountName(parentAccount);
  const percentage = Math.floor(distribution * 10000) / 100;
  const icon = <ParentCryptoCurrencyIcon currency={currency} />;
  return (
    <AccountContextMenu account={account} parentAccount={parentAccount} withStar>
      <Wrapper
        onClick={() => onAccountClick(account)}
        data-testid={`account-row-${currency.name.toLowerCase()}`}
      >
        <AccountWrapper>
          {icon}
          <Box>
            {parentAccount ? (
              <Ellipsis fontSize={10} color="palette.text.shade80">
                <Text ff="Inter|SemiBold">{parentDisplayName}</Text>
              </Ellipsis>
            ) : null}
            <ToolTip content={displayName} delay={1200}>
              <Ellipsis ff="Inter|SemiBold" color="palette.text.shade100" fontSize={3}>
                {displayName}
              </Ellipsis>
            </ToolTip>
          </Box>
        </AccountWrapper>
        <Distribution>
          {!!distribution && (
            <>
              <Text ff="Inter" color="palette.text.shade100" fontSize={3}>
                {`${percentage}%`}
              </Text>
              <Bar progress={isVisible ? percentage : 0} progressColor={color} />
            </>
          )}
        </Distribution>
        <Amount>
          <Ellipsis>
            <FormattedVal
              color={"palette.text.shade80"}
              unit={unit}
              val={amount}
              fontSize={3}
              showCode
            />
          </Ellipsis>
        </Amount>
        <Value>
          <Ellipsis>
            {distribution ? (
              <CounterValue
                currency={currency}
                value={amount}
                disableRounding
                color="palette.text.shade100"
                fontSize={3}
                showCode
              />
            ) : (
              <Text ff="Inter" color="palette.text.shade100" fontSize={3}>
                {"-"}
              </Text>
            )}
          </Ellipsis>
        </Value>
        <Dots>
          <AccountContextMenu leftClick account={account} parentAccount={parentAccount} withStar>
            <IconsLegacy.OthersMedium size={16} />
          </AccountContextMenu>
        </Dots>
      </Wrapper>
    </AccountContextMenu>
  );
}
const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;

  > * {
    display: flex;
    align-items: center;
    flex-direction: row;
    box-sizing: border-box;
  }

  &:hover {
    background: ${p => p.theme.colors.palette.background.default};
  }
`;
const AccountWrapper = styled.div`
  width: 25%;
  > :first-child {
    margin-right: 10px;
  }
  > :nth-child(2) {
    flex: 1;
    align-items: flex-start;
    margin-right: 8px;
  }
`;
const Distribution = styled.div`
  width: 25%;
  text-align: right;
  > :first-child {
    margin-right: 11px;
    width: 40px; //max width for a 99.99% case
    text-align: right;
  }
`;
const Amount = styled.div`
  width: 25%;
  text-align: right;
  justify-content: flex-end;
`;
const Value = styled.div`
  width: 20%;
  box-sizing: border-box;
  padding-left: 8px;
  text-align: right;
  justify-content: flex-end;
`;
const Dots = styled.div`
  width: 5%;
  justify-content: flex-end;
  cursor: pointer;
  color: ${p => p.theme.colors.palette.text.shade50};
  &:hover {
    color: ${p => p.theme.colors.palette.text.shade80};
  }
`;

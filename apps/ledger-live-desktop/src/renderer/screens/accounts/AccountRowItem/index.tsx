import React, { PureComponent, SyntheticEvent } from "react";
import { Trans } from "react-i18next";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import styled from "styled-components";
import { getAccountCurrency, listSubAccounts } from "@ledgerhq/live-common/account/helpers";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/currencies/index";
import { Account, TokenAccount, AccountLike, PortfolioRange } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import AccountContextMenu from "~/renderer/components/ContextMenu/AccountContextMenu";
import Text from "~/renderer/components/Text";
import TokenRow from "~/renderer/components/TokenRow";
import AngleDown from "~/renderer/icons/AngleDown";
import { matchesSearch } from "../AccountList";
import AccountSyncStatusIndicator from "../AccountSyncStatusIndicator";
import Balance from "./Balance";
import Countervalue from "./Countervalue";
import Delta from "./Delta";
import Header from "./Header";
import Star from "~/renderer/components/Stars/Star";
import {
  blacklistedTokenIdsSelector,
  hideEmptyTokenAccountsSelector,
} from "~/renderer/reducers/settings";
import Button from "~/renderer/components/Button";
import { getLLDCoinFamily } from "~/renderer/families";

const Row = styled(Box)`
  background: ${p => p.theme.colors.palette.background.paper};
  border-radius: 4px;
  border: 1px solid transparent;
  box-shadow: 0 4px 8px 0 #00000007;
  color: #abadb6;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  flex: 1;
  font-weight: 600;
  justify-content: flex-start;
  margin-bottom: 9px;
  position: relative;
  transition: background-color ease-in-out 200ms;
  :hover {
    border-color: ${p => p.theme.colors.palette.text.shade20};
  }
  :active:not(:focus-within) {
    border-color: ${p => p.theme.colors.palette.text.shade20};
    background: ${p => p.theme.colors.palette.action.hover};
  }
`;
const RowContent = styled.div<{
  disabled?: boolean;
  isSubAccountsExpanded: boolean;
}>`
  align-items: center;
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  opacity: ${p => (p.disabled ? 0.3 : 1)};
  padding: 16px 20px;
  & * {
    color: ${p => (p.disabled ? p.theme.colors.palette.text.shade100 : "auto")};
    fill: ${p => (p.disabled ? p.theme.colors.palette.text.shade100 : "auto")};
  }
`;
const TokenContent = styled.div`
  display: flex;
  padding: 4px 20px 15px;
  flex-direction: column;
  flex-grow: 1;
`;
const TokenContentWrapper = styled.div`
  position: relative;
`;
const TokenBarIndicator = styled.div`
  width: 15px;
  border-left: 1px solid ${p => p.theme.colors.palette.divider};
  z-index: 2;
  margin-left: 29px;
  position: absolute;
  left: 0;
  margin-top: -16px;
  height: 100%;
  &:hover {
    border-color: ${p => p.theme.colors.palette.text.shade60};
  }
`;
const TokenShowMoreIndicator = styled(Button)<{ expanded?: boolean }>`
  margin: ${p => (p.expanded ? 0 : -1)}px 0 0;
  display: flex;
  color: ${p => p.theme.colors.wallet};
  align-items: center;
  justify-content: center;
  border-top: 1px solid ${p => p.theme.colors.palette.divider};
  background: ${p => p.theme.colors.palette.background.paper};
  border-radius: 0px 0px 4px 4px;
  height: 32px;
  text-align: center;
  padding: 0;

  &:hover ${Text} {
    text-decoration: underline;
  }
  &:hover {
    background-color: initial;
  }

  > :nth-child(2) {
    margin-left: 8px;
    transform: rotate(${p => (p.expanded ? "180deg" : "0deg")});
  }
`;
const IconAngleDown = styled.div<{
  expanded?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  transform: ${p => (p.expanded ? "rotate(180deg)" : "rotate(0deg)")};
`;
type Props = {
  account: TokenAccount | Account;
  parentAccount?: Account | null;
  disableRounding?: boolean;
  hideEmptyTokens?: boolean;
  blacklistedTokenIds: string[];
  onClick: (b: AccountLike, a?: Account | null) => void;
  hidden?: boolean;
  range: PortfolioRange;
  search?: string;
};
type State = {
  expanded: boolean;
};
const expandedStates: {
  [key: string]: boolean;
} = {};
class AccountRowItem extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    const { account, parentAccount } = this.props;
    const accountId = parentAccount ? parentAccount.id : account.id;
    this.state = {
      expanded: expandedStates[accountId],
    };
  }

  static getDerivedStateFromProps(nextProps: Props) {
    const { account } = nextProps;
    if (account.type === "Account" && account.subAccounts) {
      return {
        expanded: expandedStates[account.id] || !!nextProps.search,
      };
    }
    return null;
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevState.expanded !== this.state.expanded && !this.state.expanded) {
      const { scrollTopFocusRef } = this;
      if (scrollTopFocusRef.current) {
        scrollTopFocusRef.current.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }

  scrollTopFocusRef = React.createRef<HTMLSpanElement>();
  onClick = () => {
    const { account, parentAccount, onClick } = this.props;
    onClick(account, parentAccount);
  };

  toggleAccordion = (e: SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const { account } = this.props;
    expandedStates[account.id] = !expandedStates[account.id];
    this.setState({
      expanded: expandedStates[account.id],
    });
  };

  render() {
    const {
      account,
      parentAccount,
      range,
      hidden,
      onClick,
      disableRounding,
      search,
      hideEmptyTokens,
      blacklistedTokenIds,
    } = this.props;
    const { expanded } = this.state;
    let currency;
    let unit;
    let mainAccount: Account | null | undefined;
    let tokens;
    let disabled;
    let isToken;
    if (account.type !== "Account") {
      currency = account.token;
      unit = account.token.units[0];
      mainAccount = parentAccount;
      isToken = mainAccount && listTokenTypesForCryptoCurrency(mainAccount.currency).length > 0;
      if (!mainAccount) return null;
    } else {
      currency = account.currency;
      unit = account.unit;
      mainAccount = account;
      tokens = listSubAccounts(account).filter(
        subAccount => !blacklistedTokenIds.includes(getAccountCurrency(subAccount).id),
      );
      disabled = !matchesSearch(search, account);
      isToken = listTokenTypesForCryptoCurrency(currency).length > 0;
      if (tokens) tokens = tokens.filter(t => matchesSearch(search, t));
    }
    const showTokensIndicator = Boolean(tokens && tokens.length > 0 && !hidden);
    const specific = mainAccount ? getLLDCoinFamily(mainAccount.currency.family).tokenList : null;
    const hasSpecificTokenWording = specific?.hasSpecificTokenWording;
    const translationMap = isToken
      ? {
          see: hasSpecificTokenWording
            ? `tokensList.${mainAccount.currency.family}.seeTokens`
            : `tokensList.seeTokens`,
          hide: hasSpecificTokenWording
            ? `tokensList.${mainAccount.currency.family}.hideTokens`
            : `tokensList.hideTokens`,
        }
      : {
          see: "subAccounts.seeSubAccounts",
          hide: "subAccounts.hideSubAccounts",
        };
    const key = `${account.id}_${hideEmptyTokens ? "hide_empty_tokens" : ""}`;
    return (
      <div
        className={`accounts-account-row-item ${tokens && tokens.length > 0 ? "has-tokens" : ""}`}
        style={{
          position: "relative",
        }}
        key={key}
        hidden={hidden}
      >
        <span
          style={{
            position: "absolute",
            top: -70,
          }}
          ref={this.scrollTopFocusRef}
        />
        <AccountContextMenu account={account}>
          <Row key={mainAccount.id}>
            <RowContent
              disabled={disabled}
              className="accounts-account-row-item-content"
              isSubAccountsExpanded={showTokensIndicator && expanded}
              onClick={this.onClick}
              data-test-id={account.type === "Account" && `account-component-${account.name}`}
            >
              <Header account={account} />
              <Box flex="12%">
                <div>
                  <AccountSyncStatusIndicator accountId={mainAccount.id} account={account} />
                </div>
              </Box>
              <Balance unit={unit} balance={account.balance} disableRounding={disableRounding} />
              <Countervalue account={account} currency={currency} range={range} />
              <Delta account={account} range={range} />
              <Star
                accountId={account.id}
                parentId={account.type !== "Account" ? account.parentId : undefined}
              />
            </RowContent>
            {showTokensIndicator && expanded ? (
              <TokenContentWrapper>
                <TokenBarIndicator onClick={this.toggleAccordion} />
                <TokenContent>
                  {tokens &&
                    tokens.map(token => (
                      <AccountContextMenu
                        key={token.id}
                        account={token}
                        parentAccount={mainAccount}
                      >
                        {!!mainAccount && (
                          <TokenRow
                            nested
                            range={range}
                            account={token}
                            parentAccount={mainAccount}
                            onClick={onClick}
                          />
                        )}
                      </AccountContextMenu>
                    ))}
                </TokenContent>
              </TokenContentWrapper>
            ) : null}
            {showTokensIndicator && !disabled && tokens && (
              <TokenShowMoreIndicator
                expanded={expanded}
                event="Account view tokens expand"
                eventProperties={{
                  currencyName: currency.name,
                }}
                onClick={this.toggleAccordion}
              >
                <Box horizontal alignContent="center" justifyContent="center">
                  <Text color="wallet" ff="Inter|SemiBold" fontSize={4}>
                    <Trans
                      i18nKey={translationMap[expanded ? "hide" : "see"]}
                      values={{
                        tokenCount: tokens.length,
                      }}
                    />
                  </Text>
                  <IconAngleDown expanded={expanded}>
                    <AngleDown size={16} />
                  </IconAngleDown>
                </Box>
              </TokenShowMoreIndicator>
            )}
          </Row>
        </AccountContextMenu>
      </div>
    );
  }
}
const mapStateToProps = createStructuredSelector({
  hideEmptyTokenAccounts: hideEmptyTokenAccountsSelector,
  blacklistedTokenIds: blacklistedTokenIdsSelector,
});
const ConnectedAccountRowItem: React.ComponentType<Props> =
  connect(mapStateToProps)(AccountRowItem);
export default ConnectedAccountRowItem;

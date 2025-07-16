import React from "react";
import styled from "styled-components";
import { Account } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import Box, { Tabbable } from "~/renderer/components/Box";
import CheckBox from "~/renderer/components/CheckBox";
import CryptoCurrencyIconWithCount from "~/renderer/components/CryptoCurrencyIconWithCount";
import FormattedVal from "~/renderer/components/FormattedVal";
import Input from "~/renderer/components/Input";
import AccountTagDerivationMode from "../AccountTagDerivationMode";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
const InputWrapper = styled.div`
  margin-left: 4px;
  width: 100%;
`;
type Props = {
  account: Account;
  isChecked?: boolean;
  isDisabled?: boolean;
  isReadonly?: boolean;
  autoFocusInput?: boolean;
  accountName: string;
  onToggleAccount?: (b: Account, a: boolean) => void;
  onEditName?: (b: Account, a: string) => void;
  hideAmount?: boolean;
};

const overflowStyles: React.CSSProperties = {
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
};

function AccountRow(props: Props) {
  const {
    account,
    isChecked,
    onEditName,
    onToggleAccount,
    accountName,
    isDisabled,
    isReadonly,
    autoFocusInput,
    hideAmount,
  } = props;

  const unit = useAccountUnit(account);

  const handlePreventSubmit = (e: React.SyntheticEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleKeyPress = (e: React.SyntheticEvent<HTMLInputElement>) => {
    // this fixes a bug with the event propagating to the Tabbable
    e.stopPropagation();
  };

  const onClickToggleAccount = () => onToggleAccount?.(account, !isChecked);

  const handleChangeName = (name: string) => onEditName?.(account, name);

  const onClickInput = (e: React.SyntheticEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (!value && onEditName) {
      // don't leave an empty input on blur
      onEditName(account, getDefaultAccountName(account));
    }
  };

  const tokenCount = (account.subAccounts && account.subAccounts.length) || 0;
  const tag = <AccountTagDerivationMode account={account} />;
  return (
    <AccountRowContainer
      className="account-row"
      isDisabled={isDisabled}
      onClick={isDisabled ? undefined : onClickToggleAccount}
    >
      <CryptoCurrencyIconWithCount currency={account.currency} count={tokenCount} withTooltip />
      <Box
        shrink
        grow
        ff="Inter|SemiBold"
        color="palette.text.shade100"
        horizontal
        alignItems="center"
        fontSize={4}
        ml={3}
      >
        {onEditName ? (
          <InputWrapper>
            <Input
              style={overflowStyles}
              value={accountName}
              onChange={handleChangeName}
              onClick={onClickInput}
              onEnter={handlePreventSubmit}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyPress={handleKeyPress}
              maxLength={getEnv("MAX_ACCOUNT_NAME_SIZE")}
              editInPlace
              autoFocus={autoFocusInput}
              renderRight={tag}
            />
          </InputWrapper>
        ) : (
          <div
            style={{
              ...overflowStyles,
              paddingLeft: 15,
              marginLeft: 4,
              width: "100%",
            }}
          >
            {accountName}
            {tag}
          </div>
        )}
      </Box>
      {!hideAmount ? (
        <FormattedVal
          val={account.balance}
          unit={unit}
          style={{
            textAlign: "right",
            width: "auto",
            minWidth: 120,
          }}
          showCode
          fontSize={4}
          color="palette.text.shade60"
        />
      ) : null}
      {!isDisabled && !isReadonly && (
        <CheckBox
          data-testid="accountRow-checkbox"
          disabled
          isChecked={isChecked || !!isDisabled}
        />
      )}
    </AccountRowContainer>
  );
}

export default React.memo(AccountRow);

const AccountRowContainer = styled(Tabbable).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  px: 3,
  flow: 1,
}))<{
  isDisabled?: boolean;
}>`
  height: 48px;
  border-radius: 4px;

  opacity: ${p => (p.isDisabled ? 0.5 : 1)};
  pointer-events: ${p => (p.isDisabled ? "none" : "auto")};

  --color: ${p => p.theme.colors.neutral.c30};
  background-color: var(--color);

  &:hover {
    --color: ${p => p.theme.colors.neutral.c40};
    background-color: var(--color);
  }

  &:active {
    --color: ${p => p.theme.colors.neutral.c60};
    background-color: var(--color);
  }
`;

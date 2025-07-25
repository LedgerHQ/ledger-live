import {
  flattenAccounts,
  getAccountCurrency,
  listSubAccounts,
} from "@ledgerhq/live-common/account/index";
import { TFunction } from "i18next";
import { Trans, withTranslation } from "react-i18next";
import { AccountLike, Account } from "@ledgerhq/types-live";
import styled from "styled-components";
import React, { useCallback, useState, useMemo } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { createFilter, components, MenuListComponentProps } from "react-select";
import { createStructuredSelector } from "reselect";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import Select, { Props as SelectProps } from "~/renderer/components/Select";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Ellipsis from "~/renderer/components/Ellipsis";
import AccountTagDerivationMode from "./AccountTagDerivationMode";
import Button from "~/renderer/components/Button";
import Plus from "~/renderer/icons/Plus";
import Text from "./Text";
import { openModal } from "../actions/modals";
import { useAccountUnit } from "../hooks/useAccountUnit";
import { WalletState, accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { useAccountName, walletSelector } from "../reducers/wallet";

const mapStateToProps = createStructuredSelector({
  accounts: shallowAccountsSelector,
});
const Tick = styled.div`
  position: absolute;
  top: -10px;
  height: 40px;
  width: 1px;
  background: ${p => p.theme.colors.palette.divider};
`;
const tokenTick = (
  <div
    style={{
      padding: "0px 6px",
    }}
  >
    <Tick />
  </div>
);
export type Option = {
  matched?: boolean;
  account?: AccountLike;
  accountName?: string;
};

const getOptionValue = (option: Option): string => (option.account && option.account.id) || "";

type CustomOption = {
  label: string;
  value: string;
  data: {
    account: AccountLike;
    accountName: string;
  };
};

const defaultFilter = createFilter({
  stringify: ({ data: { account, accountName } }: CustomOption) => {
    const currency = getAccountCurrency(account);
    return `${currency.ticker}|${currency.name}|${accountName}`;
  },
});

const filterOption =
  (o: {
    withSubAccounts?: boolean;
    enforceHideEmptySubAccounts?: boolean;
    walletState: WalletState;
  }) =>
  (candidate: CustomOption, input: string) => {
    const selfMatches = defaultFilter(candidate, input);
    if (selfMatches) return [selfMatches, true];
    if (candidate.data.account.type === "Account" && o.withSubAccounts) {
      const subAccounts = o.enforceHideEmptySubAccounts
        ? listSubAccounts(candidate.data.account)
        : candidate.data.account.subAccounts;
      if (subAccounts) {
        for (let i = 0; i < subAccounts.length; i++) {
          const ta = subAccounts[i];
          if (
            defaultFilter(
              {
                label: ta.id, // might cause UI regression :dogkek:
                value: ta.id,
                data: {
                  account: ta,
                  accountName: accountNameWithDefaultSelector(o.walletState, ta),
                },
              },
              input,
            )
          ) {
            return [true, false];
          }
        }
      }
    }
    return [false, false];
  };
const OptionMultilineContainer = styled(Box)`
  line-height: 1.3em;
`;
type AccountOptionProps = {
  account: AccountLike;
  isValue?: boolean;
  disabled?: boolean;
  singleLineLayout?: boolean;
  hideDerivationTag?: boolean;
};
export const AccountOption = React.memo<AccountOptionProps>(function AccountOption({
  account,
  isValue,
  disabled,
  hideDerivationTag = false,
  singleLineLayout = true,
}: AccountOptionProps) {
  const currency = getAccountCurrency(account);
  const unit = useAccountUnit(account);
  const name = useAccountName(account);
  const nested = "TokenAccount" === account.type;
  const balance = account.spendableBalance || account.balance;
  const textContents = singleLineLayout ? (
    <>
      <Box flex="1" horizontal alignItems="center">
        <Box flex="0 1 auto">
          <Ellipsis ff="Inter|SemiBold" fontSize={4}>
            {name}
          </Ellipsis>
        </Box>
        {!hideDerivationTag && <AccountTagDerivationMode account={account} />}
      </Box>
      <Box>
        <FormattedVal color="palette.text.shade60" val={balance} unit={unit} showCode />
      </Box>
    </>
  ) : (
    <OptionMultilineContainer flex="1">
      <Box flex="1" horizontal alignItems="center">
        <Box flex="0 1 auto">
          <Ellipsis ff="Inter|SemiBold" fontSize={4} color="palette.text.shade100">
            {name}
          </Ellipsis>
        </Box>
        {!hideDerivationTag && <AccountTagDerivationMode account={account} margin="0" />}
      </Box>
      <Box>
        <FormattedVal
          color="palette.text.shade40"
          ff="Inter|Medium"
          fontSize={3}
          val={balance}
          unit={unit}
          showCode
        />
      </Box>
    </OptionMultilineContainer>
  );
  return (
    <Box
      grow
      horizontal
      alignItems="center"
      flow={2}
      style={{
        opacity: disabled ? 0.2 : 1,
      }}
    >
      {!isValue && nested ? tokenTick : null}
      <CryptoCurrencyIcon currency={currency} size={16} />
      {textContents}
    </Box>
  );
});
const AddAccountContainer = styled(Box)<{ small?: boolean }>`
  // to prevent ScrollBlock.js (used by react-select under the hood) css stacking context issues
  position: relative;
  cursor: pointer;
  flex-direction: row;
  align-items: center;
  border-top: 1px solid ${p => p.theme.colors.palette.divider};
  padding: ${p => (p.small ? "8px 15px 8px 15px" : "10px 15px 11px 15px")};
`;
const RoundButton = styled(Button)`
  padding: 6px;
  border-radius: 9999px;
  height: initial;
`;
function AddAccountButton() {
  return (
    <RoundButton lighterPrimary>
      <Plus size={12} />
    </RoundButton>
  );
}
const AddAccountFooter = (small?: boolean) =>
  function AddAccountFooter(props: MenuListComponentProps<Option, false>) {
    const { children } = props;
    const dispatch = useDispatch();
    const openAddAccounts = useCallback(() => {
      dispatch(openModal("MODAL_ADD_ACCOUNTS", undefined));
    }, [dispatch]);
    return (
      <>
        <components.MenuList {...props}>{children}</components.MenuList>
        <AddAccountContainer small={small} onClick={openAddAccounts}>
          <Box mr={3}>
            <AddAccountButton />
          </Box>
          <Text ff="Inter|SemiBold" color="palette.primary.main" fontSize={3}>
            <Trans i18nKey="swap2.form.details.noAccountCTA" />
          </Text>
        </AddAccountContainer>
      </>
    );
  };
const extraAddAccountRenderer = (small?: boolean) => ({
  MenuList: AddAccountFooter(small),
});
const defaultRenderValue = ({ data }: { data: Option }) =>
  data.account ? <AccountOption account={data.account} isValue /> : null;
const defaultRenderOption = ({ data }: { data: Option }) =>
  data.account ? <AccountOption account={data.account} disabled={!data.matched} /> : null;
type OwnProps = {
  withSubAccounts?: boolean;
  enforceHideEmptySubAccounts?: boolean;
  filter?: (a: Account) => boolean;
  onChange: (account?: AccountLike | null, tokenAccount?: Account | null) => void;
  value: AccountLike | undefined | null;
  renderValue?: typeof defaultRenderValue;
  renderOption?: typeof defaultRenderOption;
  placeholder?: string;
  showAddAccount?: boolean;
  disabledTooltipText?: string;
} & Omit<SelectProps, "onChange">;
type Props = OwnProps & {
  accounts: Account[];
  small?: boolean;
};
export const RawSelectAccount = ({
  accounts,
  onChange,
  value,
  withSubAccounts,
  enforceHideEmptySubAccounts,
  filter,
  renderValue,
  renderOption,
  placeholder,
  showAddAccount = false,
  disabledTooltipText,
  t,
  ...props
}: Props & {
  t: TFunction;
}) => {
  const walletState = useSelector(walletSelector);

  const [searchInputValue, setSearchInputValue] = useState("");
  const filtered: Account[] = filter ? accounts.filter(filter) : accounts;
  const all = withSubAccounts
    ? flattenAccounts(filtered, {
        enforceHideEmptySubAccounts,
      })
    : filtered;
  const selectedOption = value
    ? {
        account: all.find(o => o.id === value.id),
      }
    : null;
  const onChangeCallback = useCallback(
    (option?: Option | null) => {
      if (!option) {
        onChange(null);
      } else {
        const { account } = option;
        const parentAccount =
          account && account.type !== "Account"
            ? accounts.find(a => a.id === account.parentId)
            : null;
        onChange(account, parentAccount);
      }
    },
    [accounts, onChange],
  );
  const manualFilter = useCallback(
    () =>
      all.reduce((result, option) => {
        const accountName = accountNameWithDefaultSelector(walletState, option);
        const [display, match] = filterOption({
          withSubAccounts,
          enforceHideEmptySubAccounts,
          walletState,
        })(
          {
            value: option.id,
            label: option.id,
            data: {
              accountName,
              account: option,
            },
          },
          searchInputValue,
        );
        if (display) {
          result.push({
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            matched: match && !isDisabledOption(option as { disabled?: boolean }),
            account: option,
            accountName,
          });
        }
        return result;
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      }, [] as Option[]),
    [searchInputValue, all, withSubAccounts, enforceHideEmptySubAccounts, walletState],
  );
  const extraRenderers = useMemo(() => {
    let extraProps = {};
    if (showAddAccount)
      extraProps = {
        ...extraProps,
        ...extraAddAccountRenderer(props.small),
      };
    return extraProps;
  }, [showAddAccount, props.small]);
  const structuredResults = manualFilter();
  return (
    <Select
      {...props}
      value={selectedOption}
      options={structuredResults}
      getOptionValue={getOptionValue}
      renderValue={renderValue || defaultRenderValue}
      renderOption={renderOption || defaultRenderOption}
      onInputChange={v => setSearchInputValue(v)}
      inputValue={searchInputValue}
      filterOption={null}
      isOptionDisabled={option => !option.matched}
      placeholder={placeholder || t("common.selectAccount")}
      noOptionsMessage={({ inputValue }) =>
        t("common.selectAccountNoOption", {
          accountName: inputValue,
        })
      }
      onChange={onChangeCallback}
      extraRenderers={extraRenderers}
      disabledTooltipText={disabledTooltipText}
    />
  );
};
export const SelectAccount = withTranslation()(RawSelectAccount);
const m: React.ComponentType<OwnProps> = connect(mapStateToProps)(SelectAccount);
export default m;

/**
 * @deprecated we must completely remove this concept: account.disabled is not a thing!
 */
function isDisabledOption(option: { disabled?: boolean }): boolean {
  if (!("disabled" in option)) return false;
  return Boolean(option.disabled);
}

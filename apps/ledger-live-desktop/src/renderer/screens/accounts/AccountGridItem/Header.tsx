import React from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import Ellipsis from "~/renderer/components/Ellipsis";
import Text from "~/renderer/components/Text";
import FormattedVal from "~/renderer/components/FormattedVal";
import ParentCryptoCurrencyIcon from "~/renderer/components/ParentCryptoCurrencyIcon";
import Star from "~/renderer/components/Stars/Star";
import Tooltip from "~/renderer/components/Tooltip";
import AccountSyncStatusIndicator from "../AccountSyncStatusIndicator";
import AccountTagDerivationMode from "~/renderer/components/AccountTagDerivationMode";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useAccountName } from "~/renderer/reducers/wallet";
import { Divider } from "@ledgerhq/react-ui/index";
import { useCoinModuleFeature } from "@ledgerhq/live-common/featureFlags/useCoinModuleFeature";
import { CoinFamily } from "@ledgerhq/live-common/bridge/features";
import { getMainAccount } from "@ledgerhq/live-common/account/index";

function HeadText(props: { account: AccountLike; title: string; name: string }) {
  const { title, name, account } = props;
  return (
    <Box
      style={{
        flex: 1,
        alignItems: "flex-start",
      }}
    >
      <Box
        style={{
          textTransform: "uppercase",
        }}
        horizontal
        alignItems="center"
        fontSize={10}
        color="neutral.c80"
      >
        {title}
        <AccountTagDerivationMode account={account} />
      </Box>
      <Tooltip content={name} delay={1200}>
        <Ellipsis>
          <Text fontSize={13} color="neutral.c100">
            {name}
          </Text>
        </Ellipsis>
      </Tooltip>
    </Box>
  );
}

const Header = ({
  account,
  parentAccount,
}: {
  account: AccountLike;
  parentAccount: Account | undefined | null;
}) => {
  const currency = getAccountCurrency(account);
  const unit = useAccountUnit(account);
  const name = useAccountName(account);
  const mainAccount = getMainAccount(account, parentAccount);
  const isTokenAccount = account.type === "TokenAccount";
  const isNativeAccount = account.type === "Account";
  const family = (mainAccount?.currency.family as CoinFamily) || "";
  const tokensBalanceEnabled = useCoinModuleFeature("tokensBalance", family);
  const nativeBalanceEnabled = useCoinModuleFeature("nativeBalance", family);

  let showBalance = true;
  if (isTokenAccount) {
    showBalance = tokensBalanceEnabled;
  } else if (isNativeAccount) {
    showBalance = nativeBalanceEnabled;
  }

  let title;
  switch (account.type) {
    case "Account":
      title = currency.name;
      break;
    case "TokenAccount":
      title = "token";
      break;
    default:
      title = "";
  }
  return (
    <Box flow={4}>
      <Box horizontal ff="Inter|SemiBold" flow={3} alignItems="center">
        <ParentCryptoCurrencyIcon currency={currency} bigger />
        <HeadText account={account} name={name} title={title} />
        <AccountSyncStatusIndicator
          accountId={(parentAccount && parentAccount.id) || account.id}
          account={account}
        />
        <Star accountId={account.id} />
      </Box>
      <Divider />
      {showBalance ? (
        <Box justifyContent="center">
          <FormattedVal
            alwaysShowSign={false}
            animateTicker={false}
            ellipsis
            color="neutral.c100"
            unit={unit}
            showCode
            val={account.balance}
          />
        </Box>
      ) : null}
    </Box>
  );
};

export default React.memo(Header);

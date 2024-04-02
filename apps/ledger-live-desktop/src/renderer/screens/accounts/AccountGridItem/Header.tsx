import React from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import Ellipsis from "~/renderer/components/Ellipsis";
import Bar from "~/renderer/components/Bar";
import Text from "~/renderer/components/Text";
import FormattedVal from "~/renderer/components/FormattedVal";
import ParentCryptoCurrencyIcon from "~/renderer/components/ParentCryptoCurrencyIcon";
import Star from "~/renderer/components/Stars/Star";
import Tooltip from "~/renderer/components/Tooltip";
import AccountSyncStatusIndicator from "../AccountSyncStatusIndicator";
import AccountTagDerivationMode from "~/renderer/components/AccountTagDerivationMode";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useAccountName } from "~/renderer/reducers/wallet";

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
        color="palette.text.shade80"
      >
        {title}
        <AccountTagDerivationMode account={account} />
      </Box>
      <Tooltip content={name} delay={1200}>
        <Ellipsis>
          <Text fontSize={13} color="palette.text.shade100">
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
        <ParentCryptoCurrencyIcon currency={currency} withTooltip />
        <HeadText account={account} name={name} title={title} />
        <AccountSyncStatusIndicator
          accountId={(parentAccount && parentAccount.id) || account.id}
          account={account}
        />
        <Star accountId={account.id} />
      </Box>
      <Bar size={1} color="palette.divider" />
      <Box justifyContent="center">
        <FormattedVal
          alwaysShowSign={false}
          animateTicker={false}
          ellipsis
          color="palette.text.shade100"
          unit={unit}
          showCode
          val={account.balance}
        />
      </Box>
    </Box>
  );
};

export default React.memo(Header);

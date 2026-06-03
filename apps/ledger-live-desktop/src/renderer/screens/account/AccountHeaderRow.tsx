import React from "react";
import { NavBarBackButton } from "@ledgerhq/lumen-ui-react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import AccountHeader from "./AccountHeader";
import { AccountHeaderSettingsButton } from "./AccountHeaderActions";

type Props = Readonly<{
  account: AccountLike;
  parentAccount: Account | undefined | null;
  showBackButton: boolean;
  onBack: () => void;
}>;

export default function AccountHeaderRow({
  account,
  parentAccount,
  showBackButton,
  onBack,
}: Props) {
  return (
    <Box
      horizontal
      mb={1}
      flow={4}
      style={{
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Box horizontal alignItems="center" flow={3} grow>
        {showBackButton ? (
          <NavBarBackButton
            data-testid="account-back-button"
            onClick={onBack}
            className="shrink-0"
          />
        ) : null}
        <AccountHeader account={account} parentAccount={parentAccount} />
      </Box>
      <AccountHeaderSettingsButton account={account} parentAccount={parentAccount ?? undefined} />
    </Box>
  );
}

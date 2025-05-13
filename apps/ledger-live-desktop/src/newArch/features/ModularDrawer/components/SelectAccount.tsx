import React from "react";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Box, Flex } from "@ledgerhq/react-ui/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { AccountList, Account as DetailedAccount } from "@ledgerhq/react-ui/pre-ldls/index";

type SelectAccountProps = {
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  source: string;
  flow: string;
  detailedAccounts: DetailedAccount[];
};

const CURRENT_PAGE = "Modular Account Selection";
const ROW_HEIGHT = 64;
const SPACING = 8;
const TWO_ROWS_HEIGHT = 2 * ROW_HEIGHT;
const INPUT_HEIGHT = 40;
const EXTRA_BOTTOM_MARGIN = TWO_ROWS_HEIGHT + INPUT_HEIGHT + SPACING;

export const SelectAccount = ({
  detailedAccounts,
  onAccountSelected,
  source,
  flow,
}: SelectAccountProps) => {
  const onAccountClick = (accountId: string) => {
    track("account_clicked", { currency: accountId, page: "Modular Account Selection", flow });
    // TODO to be implemented as part of LIVE-17272
    onAccountSelected({} as AccountLike, {} as Account);
  };

  return (
    <Box style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TrackPage category={source} name={CURRENT_PAGE} flow={flow} />
      <Flex
        style={{
          flex: "1",
          overflow: "auto",
          paddingBottom: `${EXTRA_BOTTOM_MARGIN}px`,
        }}
      >
        <AccountList accounts={detailedAccounts} onClick={onAccountClick} />
      </Flex>
    </Box>
  );
};

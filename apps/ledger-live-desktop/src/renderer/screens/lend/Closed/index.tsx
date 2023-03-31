import React from "react";
import { useTranslation } from "react-i18next";
import { CompoundAccountSummary } from "@ledgerhq/live-common/compound/types";
import { makeClosedHistoryForAccounts } from "@ledgerhq/live-common/compound/logic";
import { AccountLikeArray } from "@ledgerhq/types-live";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import EmptyState from "../EmptyState";
import ClosedLoans from "./ClosedLoans";
type Props = {
  accounts: AccountLikeArray;
  summaries: CompoundAccountSummary[];
  navigateToCompoundDashboard: () => void;
};
const Closed = ({ accounts, summaries, navigateToCompoundDashboard }: Props) => {
  const closedLoans = makeClosedHistoryForAccounts(summaries);
  const { t } = useTranslation();
  return (
    <Box>
      <TrackPage category="Lend" name="Closed Positions" />
      {closedLoans.length > 0 ? (
        <ClosedLoans loans={closedLoans} />
      ) : (
        <EmptyState
          title={t("lend.emptyState.closed.title")}
          description={t("lend.emptyState.closed.description")}
          buttonLabel={t("lend.emptyState.closed.cta")}
          onClick={navigateToCompoundDashboard}
        />
      )}
    </Box>
  );
};
export default Closed;

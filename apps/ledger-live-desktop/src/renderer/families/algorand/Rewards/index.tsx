import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { AlgorandAccount } from "@ledgerhq/live-common/families/algorand/types";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box/Box";
import Button from "~/renderer/components/Button";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import ToolTip from "~/renderer/components/Tooltip";
import ClaimRewards from "~/renderer/icons/ClaimReward";
import { AlgorandFamily } from "../types";
import { SubAccount } from "@ledgerhq/types-live";

type AccountBodyHeader = NonNullable<AlgorandFamily["AccountBodyHeader"]>;

const RewardsSection = ({
  account,
  parentAccount,
}: {
  account: AlgorandAccount | SubAccount;
  parentAccount: AlgorandAccount | null | undefined;
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { rewards } = mainAccount.algorandResources || {};
  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);
  const dispatch = useDispatch();
  const onRewardsClick = useCallback(() => {
    dispatch(
      openModal("MODAL_ALGORAND_CLAIM_REWARDS", {
        account,
        parentAccount,
      }),
    );
  }, [dispatch, account, parentAccount]);
  const rewardsDisabled = rewards.lte(0);
  return (
    <TableContainer mb={6}>
      <TableHeader
        title={<Trans i18nKey="algorand.claimRewards.header" />}
        tooltip={<Trans i18nKey="algorand.claimRewards.tooltip" />}
        titleProps={{
          "data-e2e": "title_Delegation",
        }}
      />
      <Box p={4} horizontal alignItems="center" justifyContent="space-between">
        <Box>
          <FormattedVal
            val={rewards}
            unit={unit}
            showCode
            fontSize={5}
            disableRounding
            color="palette.text.shade100"
          />
          <CounterValue
            color="palette.text.shade60"
            fontSize={3}
            currency={currency}
            value={rewards}
            placeholder={"-"}
          />
        </Box>
        <ToolTip
          content={
            rewardsDisabled ? (
              <Trans i18nKey="algorand.claimRewards.rewardsDisabledTooltip" />
            ) : null
          }
        >
          <Button primary onClick={onRewardsClick} disabled={rewardsDisabled}>
            <Box horizontal alignItems="center" justifyContent="space-between">
              <ClaimRewards size={16} />
              &nbsp;
              <Trans i18nKey="algorand.claimRewards.cta" />
            </Box>
          </Button>
        </ToolTip>
      </Box>
    </TableContainer>
  );
};
const Rewards: AccountBodyHeader = ({ account, parentAccount }) => {
  if (account.type === "Account") {
    return <RewardsSection account={account} parentAccount={parentAccount} />;
  }
  return null;
};
export default Rewards;

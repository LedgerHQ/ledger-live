import React from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { useHederaEnrichedDelegation } from "@ledgerhq/live-common/families/hedera/react";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Label from "~/renderer/components/Label";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ValidatorsSelect from "~/renderer/families/hedera/shared/staking/ValidatorsSelect";
import Text from "~/renderer/components/Text";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { localeSelector } from "~/renderer/reducers/settings";
import type { StepProps } from "../types";
import TranslatedError from "~/renderer/components/TranslatedError";

function StepRewards({ account, parentAccount, transaction, status, error }: Readonly<StepProps>) {
  invariant(account && transaction, "hedera: account and transaction required");
  invariant(account.hederaResources?.delegation, "hedera: delegation is required");
  const { delegation } = account.hederaResources;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const enrichedDelegation = useHederaEnrichedDelegation(account, delegation);

  const claimableRewards = enrichedDelegation.pendingReward;
  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  if (claimableRewards.lte(0)) {
    return null;
  }

  const formattedClaimableRewards = formatCurrencyUnit(unit, claimableRewards, formatConfig);

  return (
    <Box flow={4}>
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error && <ErrorBanner error={error} />}
      {status.warnings.claimRewardsFee && (
        <Alert type="warning">
          <TranslatedError error={status.warnings.claimRewardsFee} />
        </Alert>
      )}
      <Text ff="Inter|SemiBold" fontSize={4} textAlign="center">
        <Trans
          i18nKey="hedera.claimRewards.flow.steps.rewards.description"
          values={{ formattedClaimableRewards }}
          components={[<Text key={1} fontWeight="bold" />]}
        />
      </Text>
      <Box>
        <Label mb={4}>
          <Trans i18nKey="hedera.claimRewards.flow.steps.rewards.currentValidatorLabel" />
        </Label>
        <ValidatorsSelect
          disabled
          account={account}
          selectedValidatorNodeId={enrichedDelegation.validator.nodeId}
        />
      </Box>
    </Box>
  );
}

export function StepRewardsFooter({
  transitionTo,
  status,
  bridgePending,
  transaction,
  onClose,
}: Readonly<StepProps>) {
  const { errors } = status;
  const canNext = Object.keys(errors).length === 0 && !bridgePending && transaction;

  return (
    <Box horizontal justifyContent="flex-end" flow={2} grow>
      <Button mr={1} secondary onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button
        id="claim-rewards-continue-button"
        disabled={!canNext}
        primary
        onClick={() => transitionTo("connectDevice")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}

export default React.memo(StepRewards);

// @flow
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Transaction } from "@ledgerhq/live-common/families/helium/types";
import type { AccountBridge } from "@ledgerhq/live-common/types/index";
import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import ValidatorAddressField from "../../shared/fields/ValidatorAddressField";
import type { StepProps } from "../types";
import Label from "~/renderer/components/Label";
import LinkHelp from "~/renderer/components/LinkHelp";
import InfoCircle from "~/renderer/icons/InfoCircle";
import { openURL } from "~/renderer/linking";

export default function StepValidator({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  status,
  error,
  t,
}: StepProps) {
  invariant(
    account && account.heliumResources && transaction,
    "helium account, resources and transaction required",
  );

  const urlHeliumCLI = "https://docs.helium.com/wallets/ledger/";

  const updateOldValidator = oldValidatorAddress => {
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
    onUpdateTransaction(tx => {
      return bridge.updateTransaction(tx, {
        model: {
          ...tx.model,
          oldValidatorAddress,
        },
      });
    });
  };

  const updateNewValidator = newValidatorAddress => {
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
    onUpdateTransaction(tx => {
      return bridge.updateTransaction(tx, {
        model: {
          ...tx.model,
          newValidatorAddress,
        },
      });
    });
  };

  return (
    <Box flow={1}>
      <TrackPage category="Helium Delegation" name="Step Validator" />
      {error && <ErrorBanner error={error} />}
      {status ? (
        <Box flow={1}>
          <Box mb={10}>
            <Label>
              <span>
                <Trans i18nKey="families.helium.oldValidatorAddress" />
              </span>
            </Label>
          </Box>
          <Box mb={15} horizontal grow alignItems="center" justifyContent="space-between">
            <Box grow={1}>
              <ValidatorAddressField
                addressType="oldAddress"
                account={account}
                onChange={updateOldValidator}
                transaction={transaction}
                status={status}
              />
            </Box>
          </Box>
          <Box mb={10}>
            <Label>
              <span>
                <Trans i18nKey="families.helium.newValidatorAddress" />
              </span>
            </Label>
          </Box>
          <Box mb={15} horizontal grow alignItems="center" justifyContent="space-between">
            <Box grow={1}>
              <ValidatorAddressField
                addressType="newAddress"
                account={account}
                onChange={updateNewValidator}
                transaction={transaction}
                status={status}
                autoFocus={false}
              />
            </Box>
          </Box>
          <Box ff="Inter|SemiBold" fontSize={4} mr={2}>
            <LinkHelp
              style={{ flexAuto: "autp" }}
              Icon={InfoCircle}
              label={<Trans i18nKey="helium.delegation.transfer.flow.help" />}
              onClick={() => openURL(urlHeliumCLI)}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

export function StepValidatorFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
  transaction,
}: StepProps) {
  invariant(account, "account required");
  const { errors } = status;
  const canNext = !bridgePending && !errors.newValidatorAddress && !errors.oldValidatorAddress;

  return (
    <>
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          id="delegate-continue-button"
          disabled={!canNext}
          primary
          onClick={() => transitionTo("amount")}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}

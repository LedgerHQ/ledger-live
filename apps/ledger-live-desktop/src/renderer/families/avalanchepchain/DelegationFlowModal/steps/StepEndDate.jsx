// @flow
import React, { useEffect, Fragment } from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import type { StepProps } from "../types";
import invariant from "invariant";
import Alert from "~/renderer/components/Alert";
import { urls } from "~/config/urls";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { AccountBridge, Transaction } from "@ledgerhq/live-common/types";
import BigNumber from "bignumber.js";
import Label from "~/renderer/components/Label";
import styled, { withTheme } from "styled-components";
import { useAvalanchePChainPreloadData } from "@ledgerhq/live-common/families/avalanchepchain/react";
import TranslatedError from "~/renderer/components/TranslatedError";
import {
  MINUTE,
  FIVE_MINUTES,
  YEAR,
  TWO_WEEKS,
  THREE_WEEKS,
} from "@ledgerhq/live-common/families/avalanchepchain/utils";
import moment from "moment/min/moment-with-locales";
import { getInitialLanguageLocale } from "~/renderer/reducers/settings";

const Container: ThemedComponent<*> = styled(Box)`
    input[type="datetime-local"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
    }
    > * + * {
      margin-top: 5px;
    }
  }
`;

const ErrorContainer = styled(Box)`
  margin-top: 0px;
  font-size: 12px;
  width: 100%;
  transition: all 0.4s ease-in-out;
  will-change: max-height;
  max-height: ${p => (p.hasError ? 60 : 0)}px;
  min-height: ${p => (p.hasError ? 20 : 0)}px;
`;

const ErrorDisplay = styled(Box)`
  color: ${p => p.theme.colors.pearl};
`;

function StepEndDate({
  t,
  account,
  parentAccount,
  transaction,
  onUpdateTransaction,
  status,
}: StepProps) {
  const { validators } = useAvalanchePChainPreloadData();

  const selectedValidator = validators.find(v => v.nodeID === transaction.recipient);

  const unixStakeStartTime = moment().unix() + FIVE_MINUTES;
  const unixMinEndDate = unixStakeStartTime + TWO_WEEKS;
  const unixMaxEndDate = Math.min(unixStakeStartTime + YEAR, Number(selectedValidator.endTime));
  const unixDefaultEndDate = Math.min(unixStakeStartTime + THREE_WEEKS + MINUTE, unixMaxEndDate);

  useEffect(() => {
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
    onUpdateTransaction(tx => {
      return bridge.updateTransaction(tx, {
        startTime: new BigNumber(unixStakeStartTime),
        endTime: new BigNumber(unixDefaultEndDate),
        maxEndTime: new BigNumber(unixMaxEndDate),
      });
    });
    // eslint-disable-next-line
  }, []);

  if (!status) return null;

  const locale = getInitialLanguageLocale();
  moment.locale(locale);
  const minEndDate = moment.unix(unixMinEndDate).format("YYYY-MM-DDTh:mm");
  const maxEndDate = moment.unix(unixMaxEndDate).format("YYYY-MM-DDTh:mm");
  const defaultEndDate = moment.unix(unixDefaultEndDate).format("YYYY-MM-DDTHH:mm");
  const minEndDateText = moment
    .unix(unixMinEndDate)
    .add(1, "minutes")
    .format("L, LT");
  const maxEndDateText = moment.unix(unixMaxEndDate).format("L, LT");

  const updateEndTime = endTime => {
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
    onUpdateTransaction(tx => {
      return bridge.updateTransaction(tx, {
        endTime: new BigNumber(moment(endTime).unix()),
      });
    });
  };

  const { errors } = status;
  const hasErrors = Object.keys(errors).length > 0;
  const { time: timeError } = errors;

  return (
    <Container flow={4}>
      <Alert type="primary" learnMoreUrl={urls.avalanche.learnMoreStakingParameters} mb={3}>
        <Trans
          i18nKey={`avalanchepchain.delegation.flow.steps.endDate.text`}
          values={{ minEndDate: minEndDateText, maxEndDate: maxEndDateText }}
        />
      </Alert>
      <TrackPage category="Avalanche Delegation" name="Step End Date" />
      <Fragment key={account.id}>
        <Label>{t("avalanchepchain.delegation.flow.steps.endDate.label")}</Label>
        <Input
          defaultValue={defaultEndDate}
          type="datetime-local"
          min={minEndDate}
          max={maxEndDate}
          onChange={updateEndTime}
        ></Input>
        <ErrorContainer hasError={hasErrors}>
          {hasErrors && (
            <ErrorDisplay id="input-error">
              <TranslatedError error={timeError} />
            </ErrorDisplay>
          )}
        </ErrorContainer>
      </Fragment>
    </Container>
  );
}

export function StepEndDateFooter({
  transitionTo,
  account,
  parentAccount,
  status,
  bridgePending,
}: StepProps) {
  invariant(account, "avalanche account required");

  const { errors } = status;

  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;

  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button
          id="delegate-continue-button"
          disabled={!canNext}
          primary
          onClick={() => transitionTo("connectDevice")}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}

export default withTheme(StepEndDate);

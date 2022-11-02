// @flow

import invariant from "invariant";
import React from "react";
import styled from "styled-components";
import {
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import { openURL } from "~/renderer/linking";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import FormattedVal from "~/renderer/components/FormattedVal";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Button from "~/renderer/components/Button";
import Ellipsis from "~/renderer/components/Ellipsis";
import WarnBox from "~/renderer/components/WarnBox";
import TranslatedError from "~/renderer/components/TranslatedError";
import DelegationContainer from "../DelegationContainer";
import type { StepProps } from "../types";

const Container = styled(Box)`
  width: 148px;
  min-height: 170px;
  padding: 24px;
  border: 1px solid ${p => p.theme.colors.palette.text.shade20};
  border-radius: 4px;
  align-items: center;
  justify-content: center;

  & > * {
    margin-bottom: 4px;
  }

  & > :first-child {
    margin-bottom: 10px;
  }
`;

const Placeholder = styled(Box)`
  height: 14px;
`;

const StepPool = ({
  account,
  transaction,
  transitionTo,
  isRandomChoice,
  eventType,
  selectedPool,
}: StepProps) => {
  invariant(
    account && transaction && transaction.family === "cardano",
    "step summary requires account and transaction settled",
  );
  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);

  return (
    <Box flow={4} mx={40}>
      <TrackPage
        category={`Delegation Flow${eventType ? ` (${eventType})` : ""}`}
        name="Step Summary"
      />

      <DelegationContainer
        left={
          <Box>
            <Text ff="Inter|Medium" color="palette.text.shade60" fontSize={3}>
              <Trans i18nKey={`delegation.flow.steps.summary.toDelegate`} />
            </Text>
            <Container mt={1}>
              <CryptoCurrencyIcon size={32} currency={currency} />
              <Ellipsis>
                <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={3}>
                  {getAccountName(account)}
                </Text>
              </Ellipsis>
              <FormattedVal
                color={"palette.text.shade60"}
                disableRounding
                unit={unit}
                val={account.balance}
                fontSize={3}
                inline
                showCode
              />
            </Container>
          </Box>
        }
        right={
          transaction.mode === "delegate" ? (
            <Box>
              <Box horizontal justifyContent="space-between">
                <Text ff="Inter|Medium" color="palette.text.shade60" fontSize={3}>
                  <Trans i18nKey="delegation.flow.steps.summary.validator" />
                </Text>
                <Text
                  ff="Inter|SemiBold"
                  color="palette.primary.main"
                  fontSize={3}
                  onClick={() => transitionTo("validator")}
                  style={{ cursor: "pointer" }}
                >
                  <Trans i18nKey="delegation.flow.steps.summary.select" />
                </Text>
              </Box>
              <Container my={1}>
                <Ellipsis>
                  <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={3}>
                    {`${selectedPool.ticker} - ${selectedPool.name}`}
                  </Text>
                </Ellipsis>
              </Container>

              {isRandomChoice ? (
                <Text ff="Inter|Medium" color="palette.text.shade60" fontSize={2}>
                  <Trans i18nKey="delegation.flow.steps.summary.randomly" />
                </Text>
              ) : null}
            </Box>
          ) : null
        }
      />
    </Box>
  );
};

export default StepPool;

export const StepPoolFooter = ({
  t,
  account,
  parentAccount,
  error,
  status,
  bridgePending,
  transitionTo,
}: StepProps) => {
  if (!account) return null;
  // $FlowFixMe
  const anyError: ?Error = error || Object.values(status.errors)[0];
  const canNext = !bridgePending && !anyError;
  return (
    <Box horizontal alignItems="center" flow={2} grow>
      {!anyError ? (
        <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      ) : (
        <Box grow>
          <Text fontSize={13} color="alertRed">
            <TranslatedError error={anyError} field="title" />
          </Text>
        </Box>
      )}
      <Button
        id={"delegate-summary-continue-button"}
        primary
        isLoading={bridgePending}
        disabled={!canNext}
        onClick={() => transitionTo("connectDevice")}
      >
        {t("common.continue")}
      </Button>
    </Box>
  );
};

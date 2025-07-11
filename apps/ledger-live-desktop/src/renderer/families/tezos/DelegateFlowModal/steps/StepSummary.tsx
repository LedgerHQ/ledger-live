import invariant from "invariant";
import React from "react";
import styled from "styled-components";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useBaker, useDelegation } from "@ledgerhq/live-common/families/tezos/react";
import { Baker } from "@ledgerhq/live-common/families/tezos/types";
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
import InfoCircle from "~/renderer/icons/InfoCircle";
import BakerImage from "../../BakerImage";
import DelegationContainer from "../DelegationContainer";
import { StepProps } from "../types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useAccountName } from "~/renderer/reducers/wallet";
import ErrorBanner from "~/renderer/components/ErrorBanner";

const urlDelegationHelp = "https://support.ledger.com/article/360010653260-zd?redirect=false";

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

const StepSummary = ({ account, transaction, eventType, transitionTo, status }: StepProps) => {
  invariant(
    account && transaction && transaction.family === "tezos",
    "step summary requires account and transaction settled",
  );
  const accountName = useAccountName(account);
  const delegation = useDelegation(account);
  const baker = useBaker(transaction.recipient);
  const currency = getAccountCurrency(account);
  const unit = useAccountUnit(account);
  const getBakerName = (baker: Baker | undefined | null, fallback: string) =>
    baker ? baker.name : fallback;

  return (
    <Box flow={4} mx={40}>
      <TrackPage
        category={`Delegation Flow${eventType ? ` (${eventType})` : ""}`}
        name="Step Summary"
        flow="stake"
        action="delegation"
        currency="xtz"
      />

      <DelegationContainer
        undelegation={transaction.mode === "undelegate"}
        left={
          <Box>
            <Text ff="Inter|Medium" color="palette.text.shade60" fontSize={3}>
              <Trans
                i18nKey={`delegation.flow.steps.summary.${
                  transaction.mode === "delegate" ? "toDelegate" : "toUndelegate"
                }`}
              />
            </Text>
            <Container mt={1}>
              <CryptoCurrencyIcon size={32} currency={currency} />
              <Ellipsis>
                <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={3}>
                  {accountName}
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
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <Trans i18nKey="delegation.flow.steps.summary.select" />
                </Text>
              </Box>
              <Container my={1}>
                <BakerImage size={32} baker={baker} />
                <Ellipsis>
                  <Text
                    data-testid="validator-name-tezos"
                    ff="Inter|SemiBold"
                    color="palette.text.shade100"
                    fontSize={3}
                  >
                    {getBakerName(baker, transaction.recipient)}
                  </Text>
                </Ellipsis>
                {baker ? (
                  baker.capacityStatus === "full" ? (
                    <Box
                      style={{
                        cursor: "pointer",
                      }}
                      onClick={() => openURL(urlDelegationHelp)}
                      horizontal
                      flow={1}
                      color="warning"
                    >
                      <Text textAlign="center" ff="Inter|Medium" color="warning" fontSize={3}>
                        <Trans i18nKey="delegation.overdelegated" />
                      </Text>
                      <InfoCircle size={16} />
                    </Box>
                  ) : (
                    <Text
                      textAlign="center"
                      ff="Inter|Medium"
                      color="palette.text.shade60"
                      fontSize={3}
                    >
                      <Trans
                        i18nKey="delegation.flow.steps.summary.yield"
                        values={{
                          amount: baker.nominalYield,
                        }}
                      />
                    </Text>
                  )
                ) : (
                  <Placeholder />
                )}
              </Container>
            </Box>
          ) : delegation ? (
            <Box>
              <Box horizontal justifyContent="space-between">
                <Text ff="Inter|Medium" color="palette.text.shade60" fontSize={3}>
                  <Trans i18nKey="delegation.flow.steps.summary.validator" />
                </Text>
              </Box>
              <Container my={1}>
                <BakerImage size={32} baker={delegation.baker} />
                <Ellipsis>
                  <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={3}>
                    {getBakerName(delegation.baker, delegation.address)}
                  </Text>
                </Ellipsis>
                {delegation.baker ? (
                  <Text
                    textAlign="center"
                    ff="Inter|Medium"
                    color="palette.text.shade60"
                    fontSize={3}
                  >
                    <Trans
                      i18nKey="delegation.flow.steps.summary.yield"
                      values={{
                        amount: delegation.baker.nominalYield,
                      }}
                    />
                  </Text>
                ) : null}
              </Container>
            </Box>
          ) : null
        }
      />
      {transaction.mode === "delegate" ? (
        <Box mt={32}>
          <WarnBox>
            <Trans i18nKey="delegation.flow.steps.summary.termsAndPrivacy" />
          </WarnBox>
          {status.errors.sender && <ErrorBanner error={status.errors.sender} />}
        </Box>
      ) : null}
    </Box>
  );
};

export default StepSummary;

export const StepSummaryFooter = ({
  t,
  account,
  parentAccount,
  error,
  status,
  bridgePending,
  transitionTo,
}: StepProps) => {
  if (!account) return null;

  const anyError: Error | undefined | null = error || Object.values(status.errors)[0];
  const canNext = !bridgePending && !anyError;
  return (
    <Box horizontal alignItems="center" flow={2} grow>
      {!anyError || anyError === status.errors.sender ? (
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
        onClick={() => transitionTo("device")}
      >
        {t("common.continue")}
      </Button>
    </Box>
  );
};

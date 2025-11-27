// FIXME: this is a duplicate of apps/ledger-live-desktop/src/renderer/modals/Send/steps/StepSummary.tsx

import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Text from "~/renderer/components/Text";
import IconWallet from "~/renderer/icons/Wallet";
import { rgba } from "~/renderer/styles/helpers";
import { StepProps } from "../types";
import AccountTagDerivationMode from "~/renderer/components/AccountTagDerivationMode";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";

const FromToWrapper = styled.div``;
const Circle = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 32px;
  background-color: ${p => rgba(p.theme.colors.palette.primary.main, 0.1)};
  color: ${p => p.theme.colors.palette.primary.main};
  align-items: center;
  display: flex;
  justify-content: center;
  margin-right: 12px;
`;
const Separator = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.palette.text.shade20};
  width: 100%;
  margin: 15px 0;
`;

const StepSummary = ({ account, parentAccount, transaction }: StepProps) => {
  const accountName = useMaybeAccountName(account);
  const mainAccount = account && getMainAccount(account, parentAccount);

  if (!mainAccount || !transaction) {
    return null;
  }

  const currency = getAccountCurrency(account);

  return (
    <Box flow={4} mx={40}>
      <TrackPage category="Sign Raw Transaction Flow" name="Step Summary" />
      <FromToWrapper>
        <Box>
          <Box horizontal alignItems="center">
            <Circle>
              <IconWallet size={14} />
            </Circle>
            <Box flex="1">
              <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
                <Trans i18nKey="send.steps.details.from" />
              </Text>
              <Box horizontal alignItems="center">
                <Box marginRight={7}>
                  <CryptoCurrencyIcon size={22} currency={currency} />
                </Box>
                <Text
                  ff="Inter"
                  color="palette.text.shade100"
                  fontSize={4}
                  style={{
                    flex: 1,
                  }}
                >
                  {accountName}
                </Text>
                <AccountTagDerivationMode account={account} />
              </Box>
            </Box>
          </Box>
        </Box>
        <Separator />
      </FromToWrapper>
    </Box>
  );
};

export const StepSummaryFooter = (props: StepProps) => {
  const { account, transitionTo } = props;

  const onNext = async () => {
    transitionTo("device");
  };

  if (!account) {
    return null;
  }

  return (
    <Button id={"sign-summary-continue-button"} primary onClick={onNext}>
      <Trans i18nKey="common.continue" />
    </Button>
  );
};

export default StepSummary;

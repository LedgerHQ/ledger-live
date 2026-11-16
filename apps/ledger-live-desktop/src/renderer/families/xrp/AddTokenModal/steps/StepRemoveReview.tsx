import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { TrackScreen } from "@shared/analytics-react";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { useSelector } from "LLD/hooks/redux";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Text from "~/renderer/components/Text";
import { localeSelector } from "~/renderer/reducers/settings";
import { getReleasedReserve } from "../../utils";
import type { StepProps } from "../types";
import { Row, StepReviewFooter } from "./StepReview";

export default function StepRemoveReview({ tokenAccount, status, token, error }: StepProps) {
  invariant(tokenAccount && token, "xrp: token account and token required");

  const locale = useSelector(localeSelector);

  if (tokenAccount.balance.gt(0)) {
    const balance = formatCurrencyUnit(token.units[0], tokenAccount.balance, {
      locale,
      showCode: true,
      disableRounding: true,
    });

    return (
      <Box flow={1}>
        <TrackScreen category="XRP add token" name="Step Review Balance Left" />
        <Alert type="warning">
          <Trans i18nKey="xrp.removeToken.steps.review.balanceLeft" values={{ balance }} />
        </Alert>
      </Box>
    );
  }

  const releasedReserve = getReleasedReserve(status);

  const errors = Object.values(status.errors);

  const warnings = Object.values(status.warnings).filter(w => w.name !== "XrpReserveRelease");

  return (
    <Box flow={1}>
      <TrackScreen category="XRP add token" name="Step Review" />
      {error ? <ErrorBanner error={error} /> : null}
      {errors.map(statusError => (
        <ErrorBanner key={statusError.name} error={statusError} />
      ))}
      {warnings.map(warning => (
        <ErrorBanner key={warning.name} error={warning} warning />
      ))}
      <Row label={<Trans i18nKey="xrp.addToken.steps.review.token" />}>
        <Text ff="Inter|SemiBold" fontSize={4} color="neutral.c100">
          {`${token.name} (${token.ticker})`}
        </Text>
      </Row>
      <Row label={<Trans i18nKey="xrp.addToken.steps.review.issuer" />}>
        <Text ff="Inter|Regular" fontSize={3} color="neutral.c100" title={token.contractAddress}>
          {formatAddress(token.contractAddress)}
        </Text>
      </Row>
      {releasedReserve ? (
        <Alert type="primary" mb={4}>
          <div>
            <Trans
              i18nKey="xrp.removeToken.steps.review.unlocked"
              values={{ amount: releasedReserve }}
            />
          </div>
          <div>
            <Trans
              i18nKey="xrp.removeToken.steps.review.info"
              values={{ amount: releasedReserve }}
            />
          </div>
        </Alert>
      ) : null}
    </Box>
  );
}

export function StepRemoveReviewFooter(props: StepProps) {
  const { account, parentAccount, tokenAccount, onClose } = props;
  invariant(account && tokenAccount, "xrp: account and token account required");

  const openSendFlow = useOpenSendFlow();

  if (!tokenAccount.balance.gt(0)) return <StepReviewFooter {...props} />;

  const onSend = () => {
    onClose();
    openSendFlow({ account: tokenAccount, parentAccount: getMainAccount(account, parentAccount) });
  };

  return (
    <Button primary onClick={onSend} data-testid="xrp-remove-token-send">
      <Trans i18nKey="xrp.removeToken.steps.review.send" />
    </Button>
  );
}

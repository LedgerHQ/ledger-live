import React from "react";
import { Trans } from "react-i18next";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "LLD/hooks/redux";
import Alert from "~/renderer/components/Alert";
import ButtonV3 from "~/renderer/components/ButtonV3";
import Spinner from "~/renderer/components/Spinner";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box/Box";
import { accountSelector } from "~/renderer/reducers/accounts";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import { useZcashShieldedSync } from "./useZcashShieldedSync";

type Props = {
  account: ZcashAccount;
  sender: "public" | "private" | undefined;
};

const ZcashSyncStateBanner = ({ account, sender }: Props) => {
  const shieldedEnabled = useFeature("zcashShielded")?.enabled ?? false;
  // The `account` prop is a snapshot captured when the send flow opened, so it
  // does not react to the shielded sync updating the store. Read the live
  // account so the banner reflects sync progress in real time (falling back to
  // the prop when the account is not in the store, e.g. in unit tests).
  const liveAccount = useSelector(state => accountSelector(state, { accountId: account.id })) as
    | ZcashAccount
    | undefined;
  const activeAccount = liveAccount ?? account;
  const { startShieldedSync } = useZcashShieldedSync(activeAccount);

  if (!shieldedEnabled || sender !== "private" || activeAccount.currency.id !== "zcash")
    return null;

  const privateInfo = activeAccount.privateInfo;
  const syncState = privateInfo?.syncState ?? "disabled";
  const progress = privateInfo?.progress ?? 0;
  const estimatedTimeRemaining = privateInfo?.estimatedTimeRemaining ?? { hours: 0, minutes: 0 };

  if (syncState === "stopped" || syncState === "disabled") {
    return (
      <Alert type="warning" mt={4} data-testid="zcash-sync-banner-stopped">
        <Box horizontal alignItems="center" justifyContent="space-between">
          <Text>
            <Trans i18nKey="zcash.shielded.send.syncBanner.stopped.message" />
          </Text>
          <ButtonV3
            variant="main"
            onClick={startShieldedSync}
            buttonTestId="zcash-resume-sync-button"
          >
            <Trans i18nKey="zcash.shielded.send.syncBanner.stopped.cta" />
          </ButtonV3>
        </Box>
      </Alert>
    );
  }

  if (syncState === "running") {
    return (
      <Alert type="primary" mt={4} data-testid="zcash-sync-banner-running">
        <Box horizontal alignItems="center">
          <Spinner size={14} />
          <Box ml={2}>
            <Text>
              <Trans
                i18nKey="zcash.shielded.send.syncBanner.running.message"
                values={{ progress }}
              />
            </Text>
            {(estimatedTimeRemaining.hours > 0 || estimatedTimeRemaining.minutes > 0) && (
              <Text>
                <Trans
                  i18nKey="zcash.shielded.send.syncBanner.running.timeRemaining"
                  values={{
                    hours: String(estimatedTimeRemaining.hours).padStart(2, "0"),
                    minutes: String(estimatedTimeRemaining.minutes).padStart(2, "0"),
                  }}
                />
              </Text>
            )}
          </Box>
        </Box>
      </Alert>
    );
  }

  if (syncState === "outdated") {
    return (
      <Alert type="hint" mt={4} data-testid="zcash-sync-banner-outdated">
        <Box horizontal alignItems="center" justifyContent="space-between">
          <Text>
            <Trans i18nKey="zcash.shielded.send.syncBanner.outdated.message" />
          </Text>
          <ButtonV3
            variant="main"
            onClick={startShieldedSync}
            buttonTestId="zcash-sync-balance-button"
          >
            <Trans i18nKey="zcash.shielded.send.syncBanner.outdated.cta" />
          </ButtonV3>
        </Box>
      </Alert>
    );
  }

  // syncState === "complete" | "ready" → no banner
  return null;
};

export default ZcashSyncStateBanner;

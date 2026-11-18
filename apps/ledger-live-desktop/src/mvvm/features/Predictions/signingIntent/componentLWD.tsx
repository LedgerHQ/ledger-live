import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@ledgerhq/lumen-ui-react";
import { ExternalLink } from "@ledgerhq/lumen-ui-react/symbols";
import { getProductName } from "@ledgerhq/devices";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type {
  PredictionsSigningJobState,
  PredictionsSigningPrompt,
  PredictionsSigningPurpose,
} from "@features/platform-predictions";
import { InfoState } from "@shared/ui-info-state";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { DeviceActionContent } from "LLD/components/DeviceActionContent";
import { LoadingContent } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import TranslatedError from "~/renderer/components/TranslatedError";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";

/** The error's description, then its support article on a line of its own, out of the title. */
function ErrorDescription({ error }: Readonly<{ error: Error }>) {
  const { t } = useTranslation();
  const learnMoreUrl = urls.errors[error.name];

  return (
    <>
      <TranslatedError error={error} field="description" noLink />
      {learnMoreUrl && (
        <span className="mt-8 block">
          <Link
            appearance="accent"
            icon={ExternalLink}
            href={learnMoreUrl}
            onClick={event => {
              event.preventDefault();
              openURL(learnMoreUrl);
            }}
          >
            {t("common.learnMore")}
          </Link>
        </span>
      )}
    </>
  );
}

type Props = Readonly<{
  jobState: PredictionsSigningJobState | undefined;
  extraProps: PredictionsSigningPrompt;
  onClose: () => void;
}>;

const PROMPT_KEYS = {
  binding: {
    preparing: "predictions.binding.preparing",
    title: "predictions.binding.title",
    description: "predictions.binding.description",
    mismatchTitle: "predictions.binding.mismatch.title",
    mismatchDescription: "predictions.binding.mismatch.description",
  },
  order: {
    preparing: "predictions.order.preparing",
    title: "predictions.order.title",
    description: "predictions.order.description",
    mismatchTitle: "predictions.order.mismatch.title",
    mismatchDescription: "predictions.order.mismatch.description",
  },
} as const satisfies Record<PredictionsSigningPurpose, Record<string, string>>;

function Step({
  jobState,
  purpose,
  onClose,
}: Readonly<{
  jobState: PredictionsSigningJobState;
  purpose: PredictionsSigningPurpose;
  onClose: () => void;
}>) {
  const { t } = useTranslation();
  const keys = PROMPT_KEYS[purpose];

  const closeCta = {
    label: t("common.close"),
    onPress: onClose,
    testID: "predictions-signing-close",
  };

  switch (jobState.type) {
    case "signing": {
      if (!jobState.isAwaitingConfirmation) {
        return <LoadingContent title={t(keys.preparing)} testID="predictions-signing-preparing" />;
      }
      const deviceModelId = dmkToLedgerDeviceIdMap[jobState.deviceModelId];
      return (
        <>
          {/* The device is waiting for the user: closing now would leave it asking. */}
          <DeviceBlocker />
          <DeviceActionContent
            action="continue"
            deviceModelId={deviceModelId}
            deviceName={jobState.deviceName}
            title={t(keys.title, { productName: getProductName(deviceModelId) })}
            description={t(keys.description)}
            testID="predictions-signing-confirm"
          />
        </>
      );
    }
    case "error": {
      const retryCta = {
        label: t("common.retry"),
        onPress: jobState.retry,
        testID: "predictions-signing-retry",
      };
      if (jobState.error instanceof UserRefusedOnDevice) {
        return (
          <InfoState
            preset="info"
            size="hug"
            title={t("deviceIntentExecutor.initialization.retryable.userRefused.title")}
            primaryCta={closeCta}
            secondaryCta={retryCta}
            testID="predictions-signing-refused"
          />
        );
      }
      return (
        <InfoState
          preset="error"
          size="hug"
          title={<TranslatedError error={jobState.error} field="title" noLink />}
          description={<ErrorDescription error={jobState.error} />}
          primaryCta={retryCta}
          secondaryCta={closeCta}
          testID="predictions-signing-error"
        />
      );
    }
    case "mismatch":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={t(keys.mismatchTitle)}
          description={t(keys.mismatchDescription)}
          primaryCta={closeCta}
          testID="predictions-signing-mismatch"
        />
      );
  }
}

export function PredictionsSigningIntentComponentLWD({
  jobState,
  extraProps,
  onClose,
}: Props): React.ReactElement | null {
  // The executor mounts this component before the job emits its first state.
  if (!jobState) return null;

  return (
    <div key={jobState.type} className="flex animate-fade-in flex-col">
      <Step jobState={jobState} purpose={extraProps.purpose} onClose={onClose} />
    </div>
  );
}

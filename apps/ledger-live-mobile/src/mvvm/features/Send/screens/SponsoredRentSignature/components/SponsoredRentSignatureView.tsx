import React from "react";
import { Box, Button, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { InfoState } from "@shared/ui-info-state";
import type { SignRawTransactionIntentJobState } from "@ledgerhq/live-common/intents/signRawTransactionIntent";
import { DeviceIntentExecutorLWM } from "LLM/components/DeviceIntentExecutor";
import TranslatedError from "~/components/TranslatedError";
import type { RentSignatureExtraProps } from "../intents/signRawTransactionIntent/componentLWM";
import type { SponsoredRentSignatureStep } from "../hooks/useSponsoredRentSignatureViewModel";

const deviceConnectionParams = { acceptedDeviceModelIds: [] };
const noop = () => undefined;

type SponsoredRentSignatureViewProps = Readonly<{
  step: SponsoredRentSignatureStep;
  craftingLabel: string;
  feeAmountLabel: string | null;
  cancelLabel: string;
  intentExtraProps: RentSignatureExtraProps;
  onIntentJobStateChanged: (jobState: SignRawTransactionIntentJobState) => void;
  onIntentJobError: (error: unknown) => void;
  onUserCancel: () => void;
}>;

export function SponsoredRentSignatureView({
  step,
  craftingLabel,
  feeAmountLabel,
  cancelLabel,
  intentExtraProps,
  onIntentJobStateChanged,
  onIntentJobError,
  onUserCancel,
}: SponsoredRentSignatureViewProps) {
  switch (step.type) {
    case "loading":
      return (
        <Box
          lx={{
            flex: 1,
            backgroundColor: "canvas",
            paddingHorizontal: "s16",
            paddingVertical: "s24",
          }}
          testID="send-sponsored-rent-signature-crafting"
        >
          <Box lx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "s16" }}>
            <Spinner size={32} color="base" />
            <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
              {craftingLabel}
            </Text>
            {feeAmountLabel ? (
              <Text typography="body1SemiBold" lx={{ color: "base", textAlign: "center" }}>
                {feeAmountLabel}
              </Text>
            ) : null}
          </Box>
          <Button
            appearance="gray"
            size="lg"
            isFull
            onPress={onUserCancel}
            testID="send-sponsored-rent-signature-cancel"
          >
            {cancelLabel}
          </Button>
        </Box>
      );
    case "error":
      return (
        <Box lx={{ flex: 1, backgroundColor: "canvas" }}>
          <InfoState
            preset="error"
            title={<TranslatedError error={step.error} field="title" />}
            description={<TranslatedError error={step.error} field="description" />}
            primaryCta={{
              label: cancelLabel,
              onPress: onUserCancel,
              testID: "send-sponsored-rent-signature-error-cancel",
            }}
            testID="send-sponsored-rent-signature-error"
          />
        </Box>
      );
    case "signing":
      return (
        <DeviceIntentExecutorLWM
          enabled
          sourceFlow="send"
          deviceConnectionParams={deviceConnectionParams}
          deviceInitializationInput={step.deviceInitializationInput}
          intent={step.signIntent}
          intentComponentExtraProps={intentExtraProps}
          onExecutorStateChanged={noop}
          onIntentJobStateChanged={onIntentJobStateChanged}
          onIntentJobComplete={noop}
          onIntentJobError={onIntentJobError}
          cancelIntentRequestId={undefined}
          onUserCancel={onUserCancel}
        />
      );
  }
}

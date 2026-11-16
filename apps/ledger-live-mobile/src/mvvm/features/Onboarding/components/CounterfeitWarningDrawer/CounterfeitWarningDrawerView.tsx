import React from "react";
import { BottomSheetHeader, BottomSheetView, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { InfoState } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { Trans } from "~/context/Locale";
import type { CounterfeitWarningDrawerViewProps } from "./useCounterfeitWarningDrawerViewModel";

type BodyLinkProps = Readonly<{
  children?: React.ReactNode;
  onPress: () => void;
}>;

const BodyLink = ({ children, onPress }: BodyLinkProps) => (
  <Text
    typography="body2"
    lx={{ color: "muted", textDecorationLine: "underline" }}
    onPress={onPress}
    accessibilityRole="link"
  >
    {children}
  </Text>
);

const CounterfeitWarningDrawerView = ({
  isOpen,
  title,
  primaryCtaLabel,
  secondaryCtaLabel,
  onProceed,
  onConcern,
  onLedgerComLink,
  onResellerLink,
  onDismiss,
}: CounterfeitWarningDrawerViewProps) => (
  <QueuedBottomSheet
    isRequestingToBeOpened={isOpen}
    onClose={onDismiss}
    enableDynamicSizing
    testID="counterfeit-warning-drawer"
  >
    <BottomSheetView>
      <BottomSheetHeader />
      <Box lx={{ paddingHorizontal: "s16" }}>
        <InfoState
          preset="info"
          size="hug"
          title={title}
          description={
            <Trans
              i18nKey="onboarding.counterfeitWarning.body"
              components={{
                ledgerCom: <BodyLink onPress={onLedgerComLink} />,
                resellerLink: <BodyLink onPress={onResellerLink} />,
              }}
            />
          }
          primaryCta={{ label: primaryCtaLabel, onPress: onProceed }}
          secondaryCta={{ label: secondaryCtaLabel, onPress: onConcern }}
        />
      </Box>
    </BottomSheetView>
  </QueuedBottomSheet>
);

export default CounterfeitWarningDrawerView;

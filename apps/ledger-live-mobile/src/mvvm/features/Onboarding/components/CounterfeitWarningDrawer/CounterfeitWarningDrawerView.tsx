import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Spot,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { Trans } from "~/context/Locale";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
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
  <QueuedDrawerBottomSheet
    isRequestingToBeOpened={isOpen}
    onClose={onDismiss}
    enableDynamicSizing
    testID="counterfeit-warning-drawer"
  >
    <BottomSheetView>
      <BottomSheetHeader />
      <Box
        lx={{
          width: "full",
          gap: "s24",
          paddingHorizontal: "s16",
          paddingTop: "s8",
          alignItems: "center",
        }}
      >
        <Spot appearance="info" size={72} />
        <Box lx={{ width: "full", gap: "s12", alignItems: "center" }}>
          <Text
            typography="heading4SemiBold"
            lx={{ color: "base", textAlign: "center", width: "full" }}
          >
            {title}
          </Text>
          <Text typography="body2" lx={{ color: "muted", textAlign: "center", width: "full" }}>
            <Trans
              i18nKey="onboarding.counterfeitWarning.body"
              components={{
                ledgerCom: <BodyLink onPress={onLedgerComLink} />,
                resellerLink: <BodyLink onPress={onResellerLink} />,
              }}
            />
          </Text>
        </Box>
        <Box lx={{ width: "full", gap: "s16" }}>
          <Button appearance="base" size="lg" lx={{ width: "full" }} onPress={onProceed}>
            {primaryCtaLabel}
          </Button>
          <Button appearance="gray" size="lg" lx={{ width: "full" }} onPress={onConcern}>
            {secondaryCtaLabel}
          </Button>
        </Box>
      </Box>
    </BottomSheetView>
  </QueuedDrawerBottomSheet>
);

export default CounterfeitWarningDrawerView;

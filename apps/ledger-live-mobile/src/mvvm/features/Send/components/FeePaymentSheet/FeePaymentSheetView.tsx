import React from "react";
import {
  BottomSheetHeader,
  Box,
  Button,
  Card,
  CardContent,
  CardContentDescription,
  CardContentRow,
  CardContentTitle,
  CardFooter,
  CardHeader,
  CardLeading,
  CardTrailing,
  Link,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import type { FeePaymentSheetViewModel } from "./types";

const STRUCK_THROUGH = { textDecorationLine: "line-through" } as const;

export function FeePaymentSheetView({
  title,
  disclaimer,
  learnMoreLabel,
  onLearnMore,
  options,
  confirmLabel,
  confirmDisabled,
  onSelect,
  onConfirm,
}: Omit<FeePaymentSheetViewModel, "onClose">) {
  return (
    <Box testID="send-fee-payment-options" lx={{ gap: "s24" }}>
      <BottomSheetHeader density="expanded" title={title} />
      <Text typography="body2" lx={{ color: "muted" }} testID="send-fee-payment-disclaimer">
        {disclaimer}{" "}
        <Link
          appearance="accent"
          size="sm"
          onPress={onLearnMore}
          testID="send-fee-payment-learn-more"
        >
          {learnMoreLabel}
        </Link>
      </Text>
      <Box lx={{ gap: "s12" }}>
        {options.map(option => (
          <Card
            key={option.id}
            type="interactive"
            outlined={option.selected}
            disabled={option.disabled}
            onPress={() => onSelect(option.id)}
            accessibilityState={{ selected: option.selected, disabled: option.disabled }}
            testID={`send-fee-payment-option-${option.id}`}
          >
            <CardHeader>
              <CardLeading>
                <CardContent>
                  <CardContentTitle>{option.label}</CardContentTitle>
                  <CardContentDescription>{option.paidInLabel}</CardContentDescription>
                </CardContent>
              </CardLeading>
              {option.fee ? (
                <CardTrailing>
                  <CardContent testID={`send-fee-payment-option-${option.id}-fee`}>
                    <CardContentRow>
                      {option.fee.originalValue ? (
                        <Text
                          typography="body2"
                          lx={{ color: "muted" }}
                          style={STRUCK_THROUGH}
                          testID={`send-fee-payment-option-${option.id}-original-fee`}
                        >
                          {option.fee.originalValue}
                        </Text>
                      ) : null}
                      <CardContentTitle>{option.fee.value}</CardContentTitle>
                    </CardContentRow>
                    {option.fee.secondaryValue ? (
                      <CardContentDescription>{option.fee.secondaryValue}</CardContentDescription>
                    ) : null}
                  </CardContent>
                </CardTrailing>
              ) : null}
            </CardHeader>
            {option.note ? (
              <CardFooter appearance="no-background">
                <Text
                  typography="body3"
                  lx={{ color: "muted" }}
                  testID={`send-fee-payment-option-${option.id}-note`}
                >
                  {option.note}
                </Text>
              </CardFooter>
            ) : null}
          </Card>
        ))}
      </Box>
      <Button
        appearance="base"
        size="lg"
        disabled={confirmDisabled}
        onPress={onConfirm}
        testID="send-fee-payment-confirm"
      >
        {confirmLabel}
      </Button>
    </Box>
  );
}

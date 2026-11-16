import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "@shared/i18n";

type UnexpectedErrorContentViewProps = Readonly<{
  onCancel: () => void;
  onPressSupport: () => void;
}>;

export function UnexpectedErrorContentView({
  onCancel,
  onPressSupport,
}: UnexpectedErrorContentViewProps) {
  return (
    <InfoState
      preset="error"
      size="hug"
      title={<Trans i18nKey="osUpdates.unexpectedError.title" />}
      description={
        <Trans
          i18nKey="osUpdates.unexpectedError.description"
          components={{
            supportLink: (
              <Text
                typography="body2"
                lx={{ color: "base" }}
                style={{ textDecorationLine: "underline" }}
                onPress={onPressSupport}
                accessibilityRole="link"
                testID="os-update-unexpected-error-support-link"
              />
            ),
          }}
        />
      }
      secondaryCta={{
        label: <Trans i18nKey="osUpdates.actions.cancelOsUpdate" />,
        onPress: onCancel,
      }}
      testID="os-update-unexpected-error"
    />
  );
}

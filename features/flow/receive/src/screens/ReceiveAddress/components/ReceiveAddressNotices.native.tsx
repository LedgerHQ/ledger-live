import React from "react";
import { Banner, Box, Button } from "@ledgerhq/lumen-ui-rnative";
import type { ReceiveAddressNoticesProps } from "./ReceiveAddressNotices.types";

/** The service incident first, then one banner per notice. */
export function ReceiveAddressNotices({ notices, serviceWarning }: ReceiveAddressNoticesProps) {
  if (!serviceWarning && notices.length === 0) return null;

  return (
    <Box lx={{ gap: "s8" }} testID="receive-address-notices">
      {serviceWarning ? (
        <Banner
          appearance="warning"
          title={serviceWarning.title}
          primaryAction={
            <Button appearance="transparent" size="sm" onPress={serviceWarning.onPress}>
              {serviceWarning.ctaLabel}
            </Button>
          }
          testID="receive-address-service-warning"
        />
      ) : null}
      {notices.map(notice => (
        <Banner
          key={notice.id}
          appearance={notice.tone}
          description={notice.text}
          primaryAction={
            notice.learnMore ? (
              <Button appearance="transparent" size="sm" onPress={notice.learnMore.onPress}>
                {notice.learnMore.label}
              </Button>
            ) : undefined
          }
          testID={`receive-address-notice-${notice.id}`}
        />
      ))}
    </Box>
  );
}

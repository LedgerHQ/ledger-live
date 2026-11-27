import React from "react";
import { Banner, Box, Button } from "@ledgerhq/lumen-ui-rnative";
import type { ReceiveAddressNoticesProps } from "./ReceiveAddressNotices.types";

export function ReceiveAddressNotices({ notices }: ReceiveAddressNoticesProps) {
  if (notices.length === 0) return null;

  return (
    <Box lx={{ gap: "s8" }} testID="receive-address-notices">
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

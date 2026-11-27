import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-react";
import type { ReceiveAddressNoticesProps } from "./ReceiveAddressNotices.types";

export function ReceiveAddressNotices({ notices }: ReceiveAddressNoticesProps) {
  if (notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-8" data-testid="receive-address-notices">
      {notices.map(notice => (
        <Banner
          key={notice.id}
          appearance={notice.tone}
          description={notice.text}
          primaryAction={
            notice.learnMore ? (
              <Button appearance="transparent" size="sm" onClick={notice.learnMore.onPress}>
                {notice.learnMore.label}
              </Button>
            ) : undefined
          }
          data-testid={`receive-address-notice-${notice.id}`}
        />
      ))}
    </div>
  );
}

import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-react";
import type { ReceiveAddressNoticesProps } from "./ReceiveAddressNotices.types";

export function ReceiveAddressNotices({ notices, serviceWarning }: ReceiveAddressNoticesProps) {
  if (!serviceWarning && notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-8" data-testid="receive-address-notices">
      {serviceWarning ? (
        <Banner
          appearance="warning"
          title={serviceWarning.title}
          primaryAction={
            <Button appearance="transparent" size="sm" onClick={serviceWarning.onPress}>
              {serviceWarning.ctaLabel}
            </Button>
          }
          data-testid="receive-address-service-warning"
        />
      ) : null}
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

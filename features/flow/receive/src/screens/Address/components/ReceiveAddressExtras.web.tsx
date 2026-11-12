import React from "react";
import {
  Banner,
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import type { ReceiveAddressViewProps } from "../../../types";

type Props = Pick<
  ReceiveAddressViewProps,
  "notices" | "memoTag" | "help" | "verificationUnavailableMessage" | "onOpenPanel"
>;

function NavigationCard({
  title,
  onClick,
  testId,
}: Readonly<{ title: string; onClick: () => void; testId: string }>) {
  return (
    <Card type="interactive" onClick={onClick} data-testid={testId}>
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle>{title}</CardContentTitle>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <ChevronRight size={20} />
        </CardTrailing>
      </CardHeader>
    </Card>
  );
}

export function ReceiveAddressExtras({
  notices,
  memoTag,
  help,
  verificationUnavailableMessage,
  onOpenPanel,
}: Props) {
  return (
    <div className="flex flex-col gap-16" data-testid="receive-address-extras">
      {verificationUnavailableMessage ? (
        <Banner
          appearance="info"
          description={verificationUnavailableMessage}
          data-testid="receive-address-verification-unavailable"
        />
      ) : null}
      {notices.map(notice => (
        <Banner
          key={notice.id}
          appearance={notice.appearance}
          title={notice.title}
          description={notice.message}
          data-testid={`receive-address-notice-${notice.id}`}
        />
      ))}
      <div className="flex flex-col gap-8">
        {memoTag ? (
          <NavigationCard
            title={memoTag.cardTitle}
            onClick={() => onOpenPanel("memoTag")}
            testId="receive-address-memo-tag"
          />
        ) : null}
        <NavigationCard
          title={help.cardTitle}
          onClick={() => onOpenPanel("help")}
          testId="receive-address-help"
        />
      </div>
    </div>
  );
}

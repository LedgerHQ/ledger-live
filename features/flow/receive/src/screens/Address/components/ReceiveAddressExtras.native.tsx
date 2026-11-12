import React from "react";
import {
  Banner,
  Box,
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ReceiveAddressViewProps } from "../../../types";

type Props = Pick<ReceiveAddressViewProps, "notices" | "verificationUnavailableMessage">;

/** Notices shown under the action tiles. */
export function ReceiveAddressNotices({ notices, verificationUnavailableMessage }: Props) {
  if (!verificationUnavailableMessage && notices.length === 0) return null;

  return (
    <Box lx={{ gap: "s12" }} testID="receive-address-notices">
      {verificationUnavailableMessage ? (
        <Banner
          appearance="info"
          description={verificationUnavailableMessage}
          testID="receive-address-verification-unavailable"
        />
      ) : null}
      {notices.map(notice => (
        <Banner
          key={notice.id}
          appearance={notice.appearance}
          title={notice.title}
          description={notice.message}
          testID={`receive-address-notice-${notice.id}`}
        />
      ))}
    </Box>
  );
}

function NavigationCard({
  title,
  onPress,
  testID,
}: Readonly<{ title: string; onPress: () => void; testID: string }>) {
  return (
    <Card type="interactive" onPress={onPress} testID={testID}>
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

type CardsProps = Pick<ReceiveAddressViewProps, "memoTag" | "help" | "onOpenPanel">;

/** "Need a Tag/Memo?" and "Need support? Get help", pinned to the bottom of the screen. */
export function ReceiveAddressCards({ memoTag, help, onOpenPanel }: CardsProps) {
  return (
    <Box lx={{ gap: "s8" }}>
      {memoTag ? (
        <NavigationCard
          title={memoTag.cardTitle}
          onPress={() => onOpenPanel("memoTag")}
          testID="receive-address-memo-tag"
        />
      ) : null}
      <NavigationCard
        title={help.cardTitle}
        onPress={() => onOpenPanel("help")}
        testID="receive-address-help"
      />
    </Box>
  );
}

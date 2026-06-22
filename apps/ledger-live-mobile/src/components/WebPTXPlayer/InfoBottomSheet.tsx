import React from "react";
import { BottomSheetView, BottomSheetHeader, Box, Link, Text } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ValidatedInfoDialogParams } from "@ledgerhq/live-common/wallet-api/validation/validateInfoDialogParams";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";

type InfoBottomSheetProps = Readonly<{
  data: ValidatedInfoDialogParams | undefined;
  onClose: () => void;
}>;

export function InfoBottomSheet({ data, onClose }: InfoBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const isRequestingToBeOpened = !!data;
  const title = data?.title;
  const message = data?.message;
  const linkText = data?.linkText;
  const linkHref = data?.linkHref;

  const localizedLinkHref = useLocalizedUrl(linkHref ?? "");
  const showLink = Boolean(linkText && linkHref);

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isRequestingToBeOpened}
      onClose={onClose}
      enableDynamicSizing
    >
      <BottomSheetView style={{ paddingBottom: insets.bottom }}>
        <BottomSheetHeader />
        <Text typography="heading3SemiBold" lx={{ color: "base", marginBottom: "s12" }}>
          {title}
        </Text>
        <Text typography="body1" lx={{ color: "base", marginBottom: showLink ? "s16" : "s24" }}>
          {message}
        </Text>
        {showLink ? (
          <Box lx={{ marginBottom: "s24" }}>
            <Link appearance="accent" size="md" href={localizedLinkHref} isExternal>
              {linkText}
            </Link>
          </Box>
        ) : null}
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}

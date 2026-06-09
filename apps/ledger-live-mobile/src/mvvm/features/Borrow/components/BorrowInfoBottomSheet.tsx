import React from "react";
import { BottomSheetView, BottomSheetHeader, Text } from "@ledgerhq/lumen-ui-rnative";
import { Linking } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import { makeSetBorrowInfoBottomSheetAction } from "~/actions/borrow";
import { borrowInfoBottomSheetSelector } from "~/reducers/borrow";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";

export function BorrowInfoBottomSheet() {
  const dispatch = useDispatch();
  const infoBottomSheet = useSelector(borrowInfoBottomSheetSelector);
  const message = infoBottomSheet?.message;
  const title = infoBottomSheet?.title;
  const linkText = infoBottomSheet?.linkText;
  const linkHref = infoBottomSheet?.linkHref;

  const isRequestingToBeOpened = !!infoBottomSheet;

  const closeBottomSheet = () => dispatch(makeSetBorrowInfoBottomSheetAction(undefined));

  const onLinkPress = () => {
    if (linkHref) {
      Linking.openURL(linkHref);
    }
  };

  const showInlineLink = Boolean(linkText && linkHref);

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isRequestingToBeOpened}
      onClose={closeBottomSheet}
      enableDynamicSizing
    >
      <BottomSheetView>
        <BottomSheetHeader />
        <Text typography="heading3SemiBold" lx={{ color: "base", marginBottom: "s12" }}>
          {title}
        </Text>
        <Text typography="body1" lx={{ color: "base", marginBottom: "s24" }}>
          {message}
          {showInlineLink ? " " : null}
          {showInlineLink ? (
            <Text typography="body1" lx={{ color: "interactive" }} onPress={onLinkPress}>
              {linkText}
            </Text>
          ) : null}
        </Text>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}

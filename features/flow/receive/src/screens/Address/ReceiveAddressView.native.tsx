import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { Box, IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { ArrowLeft, Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { AddressContent } from "./components/AddressContent";
import { AddressOptionList } from "./components/AddressOptionList";
import { dimmedWhile } from "./components/dimmedWhile";
import { ReceiveAddressCards, ReceiveAddressNotices } from "./components/ReceiveAddressExtras";
import { HelpSheet, MemoTagSheet } from "./components/ReceiveAddressPanels";
import { useReceiveAddressView } from "./useReceiveAddressView";
import type { ReceiveAddressViewProps } from "../../types";

const NETWORK_ICON_SIZE = 20;
const CONTENT_BOTTOM_SPACING = 16;

export function ReceiveAddressView({
  title,
  networkLabel,
  assetIcon,
  networkIcon,
  status,
  blocked,
  selectAddressTitle,
  addressOptions,
  onSelectAddressOption,
  onBackToAddressSelection,
  addressParts,
  qrPayload,
  visibleActions,
  isVerifyDisabled,
  verificationUnavailableMessage,
  notices,
  memoTag,
  help,
  panel,
  verifyHint,
  onClose,
  onCopy,
  onShare,
  onVerify,
  onOpenPanel,
  onBackToAddress,
  onOpenHelpArticle,
  onLearnMoreMemoTag,
}: ReceiveAddressViewProps) {
  const { hasCopied, hint, handleCopy, handleClose } = useReceiveAddressView({
    address: qrPayload,
    onCopy,
    onClose,
    verifyHint,
  });
  // Tag/Memo and Get help open as bottom sheets over the address screen.
  const isAddressPanel = panel !== "selectAddress";
  const goBack = isAddressPanel ? onBackToAddressSelection : undefined;

  const { bottom: bottomInset } = useSafeAreaInsets();

  // While the verify hint is open, everything but the hint and the action tiles steps back.
  const dimmed = dimmedWhile(!!hint?.open);

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }} testID="receive-address">
      <Box lx={{ alignItems: "flex-start", paddingHorizontal: "s4", paddingTop: "s8" }} {...dimmed}>
        <IconButton
          icon={goBack ? ArrowLeft : Close}
          appearance="no-background"
          size="md"
          onPress={goBack ?? handleClose}
          accessibilityLabel={goBack ? "Back" : "Close"}
          testID="receive-address-close"
        />
      </Box>
      {panel === "selectAddress" ? (
        <Box lx={{ gap: "s16", padding: "s16" }}>
          <Text typography="heading2SemiBold" lx={{ color: "base" }}>
            {selectAddressTitle}
          </Text>
          <AddressOptionList
            addressOptions={addressOptions}
            onSelectAddressOption={onSelectAddressOption}
          />
        </Box>
      ) : null}
      {isAddressPanel ? (
        <ScrollView
          // Bounces only when the content is taller than the screen.
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            // The scroll runs to the screen edge; the inset keeps the last card above the home indicator.
            paddingBottom: CONTENT_BOTTOM_SPACING + bottomInset,
            gap: 24,
          }}
        >
          <Box lx={{ alignItems: "center", gap: "s8" }} {...dimmed}>
            <Text typography="heading2SemiBold" lx={{ color: "base", textAlign: "center" }}>
              {title}
            </Text>
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
              {networkIcon ? (
                <CryptoIcon
                  ledgerId={networkIcon.ledgerId}
                  ticker={networkIcon.ticker}
                  size={NETWORK_ICON_SIZE}
                  shape="square"
                />
              ) : null}
              <Text typography="body2" lx={{ color: "base" }}>
                {networkLabel}
              </Text>
            </Box>
          </Box>
          <AddressContent
            status={status}
            blocked={blocked}
            assetIcon={assetIcon}
            addressParts={addressParts}
            qrPayload={qrPayload}
            visibleActions={visibleActions}
            isVerifyDisabled={isVerifyDisabled}
            hasCopied={hasCopied}
            onShare={onShare}
            onCopy={handleCopy}
            onVerify={onVerify}
            verifyHint={hint}
          />
          {status === "ready" ? (
            <Box {...dimmed}>
              <ReceiveAddressNotices
                notices={notices}
                verificationUnavailableMessage={verificationUnavailableMessage}
              />
            </Box>
          ) : null}
          <Box lx={{ flex: 1, justifyContent: "flex-end" }} {...dimmed}>
            <ReceiveAddressCards memoTag={memoTag} help={help} onOpenPanel={onOpenPanel} />
          </Box>
        </ScrollView>
      ) : null}
      <MemoTagSheet
        isOpen={panel === "memoTag"}
        memoTag={memoTag}
        onBackToAddress={onBackToAddress}
        onLearnMoreMemoTag={onLearnMoreMemoTag}
      />
      <HelpSheet
        isOpen={panel === "help"}
        help={help}
        onOpenHelpArticle={onOpenHelpArticle}
        onBackToAddress={onBackToAddress}
      />
    </Box>
  );
}

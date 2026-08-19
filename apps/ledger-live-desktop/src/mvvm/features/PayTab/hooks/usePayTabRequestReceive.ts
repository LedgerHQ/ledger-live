import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PayCardTrackEvent, RequestReceiveProps } from "@features/flow-pay-card-request";
import { useCopyToClipboard } from "../../../hooks/useCopyToClipboard";

const REQUEST_PAGE = "Pay";

// Placeholder account until the Request flow selects one through the MAD (LIVE-35189).
const STUB_ADDRESS = "0xe4912d2d16Dd20c6B57Bf4757dAB7D240517672";
const STUB_ASSET = { name: "USD Coin", ticker: "USDC" } as const;
const STUB_NETWORK = "Base";

export type UsePayTabRequestReceive = Readonly<{
  open: () => void;
  requestReceive: RequestReceiveProps;
}>;

export function usePayTabRequestReceive(
  onTrackEvent: PayCardTrackEvent | undefined,
): UsePayTabRequestReceive {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const copyToClipboard = useCopyToClipboard();

  const open = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);

  const onCopy = useCallback((address: string) => copyToClipboard(address), [copyToClipboard]);
  // Save (card image) and Verify (device) land with LIVE-36121 / LIVE-36132.
  const noop = useCallback(() => {}, []);

  const labels = useMemo(
    () => ({
      title: t("payTab.request.title", { asset: STUB_ASSET.name }),
      networkLabel: t("payTab.request.networkLabel", { network: STUB_NETWORK }),
      actions: {
        share: t("payTab.request.actions.share"),
        copy: t("payTab.request.actions.copy"),
        copied: t("payTab.request.actions.copied"),
        save: t("payTab.request.actions.save"),
        verify: t("payTab.request.actions.verify"),
      },
    }),
    [t],
  );

  const requestReceive = useMemo<RequestReceiveProps>(
    () => ({
      isOpen,
      address: STUB_ADDRESS,
      asset: STUB_ASSET,
      network: STUB_NETWORK,
      page: REQUEST_PAGE,
      labels,
      assetIcon: { ledgerId: "usd_coin", ticker: STUB_ASSET.ticker, network: "base" },
      networkIcon: { ledgerId: "base", ticker: "ETH" },
      visibleActions: ["save", "copy", "verify"],
      onShare: noop,
      onCopy,
      onSave: noop,
      onVerify: noop,
      onClose,
      onTrackEvent,
    }),
    [isOpen, labels, noop, onCopy, onClose, onTrackEvent],
  );

  return { open, requestReceive };
}

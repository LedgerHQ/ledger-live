import { useCallback, useMemo, useState } from "react";
import type { ReceiveToolAsset, ReceiveToolProps, ReceiveTriggerSectionProps } from "../types";
import { copy, DEFAULT_RECEIVE_DEEPLINK, parseFamilies } from "./copy";

/** One row of the receive list, ready for either platform's list item. */
export interface ReceiveRow {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly accessibilityLabel: string;
  readonly icon: { readonly ledgerId: string; readonly ticker: string; readonly network?: string };
  readonly onPress: () => void;
}

/** URL.canParse is missing from the React Native URL polyfill. */
function isUrl(value: string): boolean {
  try {
    return Boolean(new URL(value).protocol);
  } catch {
    return false;
  }
}

function toRow(
  asset: ReceiveToolAsset,
  onReceive: ReceiveTriggerSectionProps["onReceive"],
): ReceiveRow {
  const { legacyAccountId, assetId } = asset;
  return {
    key: asset.id,
    title: asset.label,
    description: asset.network,
    accessibilityLabel: `${asset.label}, ${asset.network}`,
    icon: { ledgerId: asset.currencyId, ticker: asset.ticker, network: asset.networkId },
    onPress: () => onReceive({ legacyAccountId, assetId }),
  };
}

/** Local UI state of the tool: the excluded families and deeplink drafts, applied on demand. */
export function useReceiveToolViewModel({ flag, trigger }: ReceiveToolProps) {
  const [excludedDraft, setExcludedDraft] = useState(flag.excludedFamilies.join(", "));
  const [deeplinkDraft, setDeeplinkDraft] = useState(DEFAULT_RECEIVE_DEEPLINK);
  const deeplinkUrl = deeplinkDraft.trim();
  const canOpenDeeplink = isUrl(deeplinkUrl);

  const applyExcludedFamilies = useCallback(
    () => flag.setExcludedFamilies(parseFamilies(excludedDraft)),
    [flag, excludedDraft],
  );

  const openDeeplink = useCallback(() => {
    if (canOpenDeeplink) trigger.onOpenDeeplink(deeplinkUrl);
  }, [trigger, canOpenDeeplink, deeplinkUrl]);

  const rows = useMemo(
    () => trigger.assets.map(asset => toRow(asset, trigger.onReceive)),
    [trigger],
  );

  return {
    flag,
    excluded: { draft: excludedDraft, setDraft: setExcludedDraft, apply: applyExcludedFamilies },
    deeplink: {
      draft: deeplinkDraft,
      setDraft: setDeeplinkDraft,
      open: openDeeplink,
      canOpen: canOpenDeeplink,
      error: canOpenDeeplink ? undefined : copy.invalidDeeplink,
    },
    rows,
    pickAsset: trigger.onPickAsset,
  };
}

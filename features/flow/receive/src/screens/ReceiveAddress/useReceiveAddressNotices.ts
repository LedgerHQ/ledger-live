import { useMemo } from "react";
import type { ReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { canVerifyOnDevice } from "../../logic/canVerifyOnDevice";
import type { ReceiveAddressOption } from "../../logic/toReceiveAddressOptions";
import { toReceiveNotices } from "../../logic/toReceiveNotices";
import type { ReceiveFamilyConfig } from "../../types";
import type { ReceiveNoticeView } from "./ReceiveAddressView.types";

type Params = Readonly<{
  familyConfig: ReceiveFamilyConfig | undefined;
  selected: ReceiveAddressOption | undefined;
  copy: ReceiveAddressCopy;
  onOpenUrl: ((url: string) => void) | undefined;
}>;

export function useReceiveAddressNotices({
  familyConfig,
  selected,
  copy,
  onOpenUrl,
}: Params): readonly ReceiveNoticeView[] {
  const familyNotices = familyConfig?.notices;

  return useMemo(
    () =>
      selected
        ? toReceiveNotices({
            familyNotices: familyNotices ?? [],
            canVerifyOnDevice: canVerifyOnDevice(selected.verification),
          }).map(({ id, tone, learnMoreUrl }) => ({
            id,
            tone,
            text: copy.noticeTexts[id],
            learnMore:
              learnMoreUrl && onOpenUrl
                ? { label: copy.learnMoreLabel, onPress: () => onOpenUrl(learnMoreUrl) }
                : undefined,
          }))
        : [],
    [selected, familyNotices, copy, onOpenUrl],
  );
}

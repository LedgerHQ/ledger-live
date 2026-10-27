import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { AccountNoticeId } from "../../model/types";
import type { AccountStatusBannerProps } from "../AccountStatusBanner/AccountStatusBanner.types";
import type { AccountNoticesProps } from "./AccountNotices.types";
import { noticeAction } from "./noticeAction";
import { noticeContent } from "./noticeContent";

export type NoticeBanner = Readonly<
  { id: AccountNoticeId } & Omit<AccountStatusBannerProps, "testID">
>;

export function useAccountNoticesViewModel({
  notices,
  onOpenLink,
  onOpenPerps,
}: AccountNoticesProps): readonly NoticeBanner[] {
  const { t } = useTranslation();

  return useMemo(
    () =>
      notices.map(notice => ({
        id: notice.id,
        ...noticeContent(t, notice),
        ...noticeAction(notice, { onOpenLink, onOpenPerps }),
      })),
    [notices, onOpenLink, onOpenPerps, t],
  );
}

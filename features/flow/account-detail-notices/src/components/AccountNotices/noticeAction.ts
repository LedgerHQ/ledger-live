import type { AccountNotice } from "../../model/types";
import type { AccountStatusBannerProps } from "../AccountStatusBanner/AccountStatusBanner.types";
import type { AccountNoticesProps } from "./AccountNotices.types";

type Handlers = Pick<AccountNoticesProps, "onOpenLink" | "onOpenPerps">;

export function noticeAction(
  notice: AccountNotice,
  { onOpenLink, onOpenPerps }: Handlers,
): Pick<AccountStatusBannerProps, "action" | "onAction"> {
  if (!("action" in notice) || !notice.action) return {};
  const { action } = notice;
  if (action.type === "openPerps") return { action: "openPerps", onAction: onOpenPerps };
  return { action: "learnMore", onAction: () => onOpenLink(action.link) };
}

import type { useTranslation } from "@shared/i18n";
import type { AccountNotice } from "../../model/types";

type Translate = ReturnType<typeof useTranslation>["t"];

export type NoticeContent = Readonly<{ title: string; description?: string }>;

export function noticeContent(t: Translate, notice: AccountNotice): NoticeContent {
  switch (notice.id) {
    case "regionRestricted":
      return {
        title: t("accountDetailNotices.regionRestricted.title", {
          currencyName: notice.currencyName,
        }),
        description: t("accountDetailNotices.regionRestricted.description"),
      };
    case "migration":
      return {
        title: t("accountDetailNotices.migration.title", { from: notice.from, to: notice.to }),
        description: t("accountDetailNotices.migration.description"),
      };
    case "willBeDeprecated":
      return {
        title: t("accountDetailNotices.willBeDeprecated.title", {
          currencyName: notice.currencyName,
          date: notice.date,
        }),
        description: t("accountDetailNotices.willBeDeprecated.description"),
      };
    case "custom":
      return { title: notice.text };
    case "robinhoodDisclaimer":
      return { title: t("accountDetailNotices.robinhoodDisclaimer.title") };
    case "perps":
      return {
        title: t("accountDetailNotices.perps.title"),
        description: t("accountDetailNotices.perps.description"),
      };
  }
}

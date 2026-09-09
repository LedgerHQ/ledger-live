import type { MoreRow, MoreRowId, MoreViewProps } from "./types";

const MORE_LABEL = "More";

export const MORE_ROW_TITLES: Readonly<Record<MoreRowId, string>> = {
  managePin: "Manage PIN Code",
  accessBaanx: "Access to Baanx",
  help: "Help",
  logout: "Logout",
};

export const MORE_RESOURCES = {
  en: {
    translation: {
      payTab: {
        cardMore: {
          tile: MORE_LABEL,
          title: MORE_LABEL,
          rows: MORE_ROW_TITLES,
        },
      },
    },
  },
};

const ROW_ORDER: readonly MoreRowId[] = ["managePin", "accessBaanx", "help", "logout"];

const noop = () => {};

export function buildMoreRows(
  handlers: Partial<Record<MoreRowId, () => void>> = {},
): readonly MoreRow[] {
  return ROW_ORDER.map(id => ({
    id,
    title: MORE_ROW_TITLES[id],
    onPress: handlers[id] ?? noop,
  }));
}

export function buildMoreViewProps(overrides: Partial<MoreViewProps> = {}): MoreViewProps {
  return {
    moreLabel: MORE_LABEL,
    sheetTitle: MORE_LABEL,
    rows: buildMoreRows(),
    isSheetOpen: false,
    onMorePress: noop,
    onSheetClose: noop,
    ...overrides,
  };
}

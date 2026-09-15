import type {
  LumenStyleSheetTheme,
  LumenTypographyTokenName,
  LumenViewStyle,
} from "@ledgerhq/lumen-ui-rnative/styles";

export type WalletV4TourImageSource = {
  readonly light: number;
  readonly dark: number;
};

export type WalletV4TourSlide = {
  readonly titleKey: string;
  readonly subTitleKey?: string;
  readonly imageSrc: WalletV4TourImageSource;
};

export type WalletV4TourTitleLayout = {
  readonly typography: LumenTypographyTokenName;
  readonly marginTop?: LumenViewStyle["marginTop"];
  /** When set, the title is vertically centered in a block of that height. */
  readonly minHeight?: LumenViewStyle["minHeight"];
};

export type WalletV4TourLayout = {
  readonly slidesListHeight: number;
  readonly slidesContainerHeight: number;
  readonly progressMarginTop: keyof LumenStyleSheetTheme["spacings"];
  readonly title: WalletV4TourTitleLayout;
};

export type WalletV4TourCopy = {
  readonly startKey: string;
  readonly nextKey: string;
  readonly doneKey: string;
};

export type WalletV4Tour = {
  /** Analytics page name shared by the screen view and the button events. */
  readonly page: string;
  readonly testID: string;
  readonly slides: readonly WalletV4TourSlide[];
  readonly copy: WalletV4TourCopy;
  readonly layout: WalletV4TourLayout;
};

export interface WalletV4TourDrawerViewModel {
  readonly isDrawerOpen: boolean;
  readonly handleOpenDrawer: () => void;
  readonly handleCloseDrawer: () => void;
  readonly closeDrawer: () => void;
  readonly onSlideChange: (index: number) => void;
}

import { useCallback, useMemo, type ComponentType } from "react";
import { Minus, Chart5 } from "@ledgerhq/lumen-ui-rnative/symbols";
import { type IconProps } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "../../../../../testIds";

export type MoreOptionId = "sell" | "earn";

export type MoreOption = {
  id: MoreOptionId;
  icon: ComponentType<IconProps>;
  label: string;
  testID?: string;
  onPress: () => void;
};

type MaybeMoreOption = MoreOption | false;

const isMoreOption = (option: MaybeMoreOption): option is MoreOption => Boolean(option);

type Params = Readonly<{
  isSellAvailable: boolean;
  isEarnAvailable: boolean;
  onClose: () => void;
  onSellPress: () => void;
  onEarnPress: () => void;
}>;

export function useMoreOptionsBottomSheetViewModel({
  isSellAvailable,
  isEarnAvailable,
  onClose,
  onSellPress,
  onEarnPress,
}: Params) {
  const { t } = useTranslation();

  const handleSellPress = useCallback(() => {
    onClose();
    onSellPress();
  }, [onClose, onSellPress]);

  const handleEarnPress = useCallback(() => {
    onClose();
    onEarnPress();
  }, [onClose, onEarnPress]);

  const options = useMemo<MoreOption[]>(() => {
    const maybeOptions: MaybeMoreOption[] = [
      isSellAvailable && {
        id: "sell",
        icon: Minus,
        label: t("assetDetail.footer.moreOptions.sell"),
        testID: ASSET_DETAIL_TEST_IDS.footerSellButton,
        onPress: handleSellPress,
      },
      isEarnAvailable && {
        id: "earn",
        icon: Chart5,
        label: t("assetDetail.footer.moreOptions.earn"),
        testID: ASSET_DETAIL_TEST_IDS.footerEarnButton,
        onPress: handleEarnPress,
      },
    ];

    return maybeOptions.filter(isMoreOption);
  }, [t, isSellAvailable, isEarnAvailable, handleSellPress, handleEarnPress]);

  return { options };
}

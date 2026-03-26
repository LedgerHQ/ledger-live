import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { PortfolioCryptosSection } from "LLM/features/WalletAssets/views/CryptosSection";
import { PortfolioStablecoinsSection } from "LLM/features/WalletAssets/views/StablecoinsSection";
import { PortfolioButtonSection } from "LLM/features/WalletAssets/views/ButtonSection";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { useTranslation } from "~/context/Locale";
import { useWalletAssetsViewModel } from "./useWalletAssetsViewModel";

interface WalletAssetsViewProps {
  isEmptyState?: boolean;
  hideButton?: boolean;
  noPaddingHorizontal?: boolean;
}

export const WalletAssetsView: React.FC<WalletAssetsViewProps> = ({
  isEmptyState = false,
  hideButton = false,
  noPaddingHorizontal = false,
}) => {
  const {
    hasMore,
    onPressShowAll,
    shouldAddBottomPadding,
    shouldDisplayAssetSection,
    isAddModalOpened,
    openAddModal,
    closeAddModal,
  } = useWalletAssetsViewModel({ isEmptyState });
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();

  const renderButton = () => {
    if (hideButton) return null;
    if (isEmptyState && !shouldDisplayAssetSection) {
      return (
        <>
          <Button
            appearance="gray"
            size="lg"
            lx={{ width: "full", marginTop: "s24", marginBottom: "s48" }}
            onPress={openAddModal}
            testID="add-account-cta"
          >
            {t("account.emptyState.addCryptoAccount")}
          </Button>
          <AddAccountDrawer
            isOpened={isAddModalOpened}
            onClose={closeAddModal}
            doesNotHaveAccount
          />
        </>
      );
    }
    return (
      <Box
        lx={{ paddingTop: "s24" }}
        style={shouldAddBottomPadding ? { paddingBottom: 16 } : undefined}
      >
        <PortfolioButtonSection hasMore={hasMore} onPressShowAll={onPressShowAll} />
      </Box>
    );
  };

  return (
    <Box
      lx={noPaddingHorizontal ? undefined : { paddingHorizontal: "s16" }}
      style={shouldAddBottomPadding ? { paddingBottom: bottom } : undefined}
    >
      {shouldDisplayAssetSection ? (
        <>
          <PortfolioCryptosSection isEmptyState={isEmptyState} />
          <Box lx={{ paddingTop: "s24" }}>
            <PortfolioStablecoinsSection isEmptyState={isEmptyState} />
          </Box>
        </>
      ) : (
        <PortfolioCryptosSection isReadOnly />
      )}
      {renderButton()}
    </Box>
  );
};

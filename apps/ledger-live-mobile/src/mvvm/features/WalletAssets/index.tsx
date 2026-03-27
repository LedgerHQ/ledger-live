import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { PortfolioCryptosSection } from "LLM/features/WalletAssets/views/CryptosSection";
import { PortfolioStablecoinsSection } from "LLM/features/WalletAssets/views/StablecoinsSection";
import { PortfolioButtonSection } from "LLM/features/WalletAssets/views/ButtonSection";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { useTranslation } from "~/context/Locale";
import { useWalletAssetsViewModel } from "./hooks/useWalletAssetsViewModel";
import { useAddAccountCta } from "./hooks/useAddAccountCta";
import { WalletAssetsVariant } from "./types";

interface WalletAssetsViewProps {
  variant?: WalletAssetsVariant;
  noPaddingHorizontal?: boolean;
}

export const WalletAssetsView: React.FC<WalletAssetsViewProps> = ({
  variant = "normal",
  noPaddingHorizontal = false,
}) => {
  const { hasMore, onPressShowAll, shouldAddBottomPadding, shouldDisplayAssetSection } =
    useWalletAssetsViewModel();
  const { isOpen: isAddModalOpened, open: openAddModal, close: closeAddModal } = useAddAccountCta();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();

  const renderSections = () => {
    if (!shouldDisplayAssetSection) {
      return <PortfolioCryptosSection variant="readOnly" />;
    }
    return (
      <Box lx={{ gap: "s24" }}>
        <PortfolioCryptosSection variant={variant} />
        <PortfolioStablecoinsSection variant={variant} />
      </Box>
    );
  };

  const renderButtonSection = () => {
    if (variant === "readOnly") return null;
    return (
      <Box lx={{ paddingTop: "s24" }}>
        {variant === "emptyState" && !shouldDisplayAssetSection ? (
          <>
            <Button
              appearance="gray"
              size="lg"
              lx={{ width: "full" }}
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
        ) : (
          <PortfolioButtonSection hasMore={hasMore} onPressShowAll={onPressShowAll} />
        )}
      </Box>
    );
  };

  return (
    <Box
      lx={noPaddingHorizontal ? undefined : { paddingHorizontal: "s16" }}
      style={
        variant !== "readOnly" && shouldAddBottomPadding
          ? { paddingBottom: bottom + 16 }
          : undefined
      }
    >
      {renderSections()}
      {renderButtonSection()}
    </Box>
  );
};

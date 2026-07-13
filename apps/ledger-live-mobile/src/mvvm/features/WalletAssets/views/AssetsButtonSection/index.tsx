import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { useTranslation } from "~/context/Locale";
import { PortfolioButtonSection } from "LLM/features/WalletAssets/views/ButtonSection";
import { useAddAccountCta } from "LLM/features/WalletAssets/hooks/useAddAccountCta";
import { WalletAssetsVariant } from "LLM/features/WalletAssets/types";

interface AssetsButtonSectionProps {
  variant: WalletAssetsVariant;
  shouldDisplayAssetSection: boolean;
  hasMore: boolean;
  onPressShowAll: () => void;
}

export const AssetsButtonSection: React.FC<AssetsButtonSectionProps> = ({
  variant,
  shouldDisplayAssetSection,
  hasMore,
  onPressShowAll,
}) => {
  const { t } = useTranslation();
  const { isOpen, open, close } = useAddAccountCta();

  if (variant === "readOnly") return null;

  if (variant === "emptyState" && !shouldDisplayAssetSection) {
    return (
      <Box lx={{ paddingTop: "s24" }}>
        <Button
          appearance="gray"
          size="lg"
          lx={{ width: "full" }}
          onPress={open}
          testID="add-account-cta"
        >
          {t("account.emptyState.addCryptoAccount")}
        </Button>
        <AddAccountDrawer isOpened={isOpen} onClose={close} doesNotHaveAccount />
      </Box>
    );
  }

  return (
    <Box lx={{ paddingTop: "s24" }}>
      <PortfolioButtonSection hasMore={hasMore} onPressShowAll={onPressShowAll} />
    </Box>
  );
};

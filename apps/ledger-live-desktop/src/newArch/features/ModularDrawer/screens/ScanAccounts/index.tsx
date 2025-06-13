import { Box, Button, Flex, Text, Link, Icons } from "@ledgerhq/react-ui";
import {
  AccountItem,
  Account as AccountItemAccount,
} from "@ledgerhq/react-ui/pre-ldls/components/AccountItem/AccountItem";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { default as React } from "react";
import { useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Title } from "../../components/Header/Title";
import { MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY } from "../../types";
import { useTheme } from "styled-components";
import { LoadingOverlay } from "LLD/components/LoadingOverlay";
import { useScanAccounts } from "../../hooks/useScanAccounts";

interface Props {
  currency: CryptoCurrency;
  deviceId: string;
  onComplete: (_: Account[]) => void;
}

const ScanAccounts = ({ currency, deviceId, onComplete }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    formattedAccounts,
    checkedIds,
    handleToggle,
    handleSelectAll,
    handleDeselectAll,
    handleConfirm,
    isScanning,
    isScanning$,
    currencyName,
  } = useScanAccounts({
    currency,
    deviceId,
    onComplete,
    existingAccounts: [],
    blacklistedTokenIds: [],
  });

  const renderAccount = (x: AccountItemAccount) => (
    <Box mb={16}>
      <AccountItem
        account={x}
        checkbox={{
          name: "checked",
          isChecked: checkedIds.has(x.id),
          onChange: () => {},
        }}
        onClick={() => handleToggle(x.id)}
        backgroundColor={colors.opacityDefault.c05}
      />
    </Box>
  );

  return (
    <>
      <TrackPage
        category={MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY}
        name="ScanAccounts"
        currencyName={currencyName}
      />

      {isScanning ? <LoadingOverlay theme="dark" /> : null}

      <Title
        translationKey={
          isScanning
            ? "modularAssetDrawer.scanAccounts.title"
            : "modularAssetDrawer.addAccounts.title"
        }
      />

      <Box flex={1}>
        <Flex alignItems="center" justifyContent="space-between" mb="2">
          <Text variant="h5Inter" fontSize="small" color="neutral.c80">
            {t(
              isScanning
                ? "modularAssetDrawer.scanAccounts.status.scanning"
                : formattedAccounts.length === 0
                  ? "modularAssetDrawer.scanAccounts.status.noAccounts"
                  : "modularAssetDrawer.scanAccounts.status.foundAccounts",
              { count: formattedAccounts.length },
            )}
          </Text>
          {formattedAccounts.length > 0 ? (
            formattedAccounts.length === checkedIds.size ? (
              <Link size="small" onClick={handleDeselectAll}>
                {t("modularAssetDrawer.addAccounts.controls.deselectAll")}
              </Link>
            ) : (
              <Link size="small" onClick={handleSelectAll}>
                {t("modularAssetDrawer.addAccounts.controls.selectAll")}
              </Link>
            )
          ) : null}
        </Flex>

        {formattedAccounts.map(account => {
          return renderAccount(account);
        })}
        {!isScanning && formattedAccounts.length > 0 ? (
          <Box flex={1}>
            <Flex alignItems="center" justifyContent="space-between" mb="2">
              <Text variant="h5Inter" fontSize="small" color="neutral.c80">
                {t("modularAssetDrawer.addAccounts.newAccount")}
              </Text>
            </Flex>

            {formattedAccounts.map(account => {
              return renderAccount(account);
            })}
          </Box>
        ) : null}
      </Box>

      <Flex justifyContent="flex-end">
        {isScanning ? (
          <Button
            alignItems="center"
            flex={1}
            Icon={<Icons.Pause />}
            iconPosition="left"
            onClick={() => isScanning$.next(false)}
            size="xl"
            variant="main"
          >
            {t("modularAssetDrawer.scanAccounts.cta.stopScanning")}
          </Button>
        ) : (
          <Button
            alignItems="center"
            color="neutral.c100"
            disabled={checkedIds.size === 0}
            flex={1}
            onClick={handleConfirm}
            size="xl"
            variant="main"
          >
            {t("modularAssetDrawer.addAccounts.cta.confirm")}
          </Button>
        )}
      </Flex>
    </>
  );
};

export default ScanAccounts;

import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import BigNumber from "bignumber.js";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "~/context/Locale";
import { ScrollView } from "react-native";
import type { TFunction } from "i18next";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import type { ModalInfo } from "~/modals/Info";
import type { AccountLike } from "@ledgerhq/types-live";
import InfoModal from "~/modals/Info";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";
import SectionTitle from "~/screens/WalletCentricSections/SectionTitle";
import { PRIVATE_BALANCE_PLACEHOLDER } from "@ledgerhq/live-common/families/aleo/constants";

type InfoName = "transparent" | "private";

function AleoBalanceSummary({ account }: { readonly account: AleoAccount }) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName>();
  const info = useMemo(() => getInfo(t), [t]);
  const unit = useAccountUnit(account);

  const { aleoResources } = account;
  const transparentBalance = aleoResources?.transparentBalance ?? BigNumber(0);
  const privateBalance = aleoResources?.privateBalance ?? null;

  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);
  const onPressInfoCreator = useCallback((name: InfoName) => () => setInfoName(name), []);

  return (
    <SectionContainer mt={8} paddingTop={6}>
      <SectionTitle title={t("aleo.balancesSection")} containerProps={{ mx: 6, mb: 3 }} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingHorizontal: 16 }}
      >
        <InfoModal
          isOpened={!!infoName}
          onClose={onCloseModal}
          data={infoName ? info[infoName] : []}
        />
        <Box style={{ flexDirection: "row" }}>
          <InfoItem
            title={t("aleo.info.transparent.title")}
            onPress={onPressInfoCreator("transparent")}
            value={<CurrencyUnitValue unit={unit} value={transparentBalance} disableRounding />}
          />
          <InfoItem
            isLast
            title={t("aleo.info.private.title")}
            onPress={onPressInfoCreator("private")}
            value={
              privateBalance === null ? (
                PRIVATE_BALANCE_PLACEHOLDER
              ) : (
                <CurrencyUnitValue unit={unit} value={privateBalance} disableRounding />
              )
            }
          />
        </Box>
      </ScrollView>
    </SectionContainer>
  );
}

export default function AccountBalanceHeader({ account }: { readonly account?: AccountLike }) {
  const aleoAccount = account as AleoAccount;
  if (!aleoAccount?.aleoResources || aleoAccount.balance.lte(0)) return null;
  return <AleoBalanceSummary account={aleoAccount} />;
}

function getInfo(t: TFunction<"translation">): Record<InfoName, ModalInfo[]> {
  return {
    transparent: [
      {
        title: t("aleo.info.transparent.title"),
        description: t("aleo.info.transparent.description"),
      },
    ],
    private: [
      {
        title: t("aleo.info.private.title"),
        description: t("aleo.info.private.description"),
      },
    ],
  };
}

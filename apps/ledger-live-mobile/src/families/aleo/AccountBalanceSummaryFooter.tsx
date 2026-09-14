import React, { useCallback, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { Box } from "@ledgerhq/native-ui";
import type { TFunction } from "i18next";
import type { Account } from "@ledgerhq/types-live";
import { useStakingPosition } from "@ledgerhq/live-common/families/aleo/react";
import { getUnstakingBalance } from "@ledgerhq/live-common/families/aleo/stakingDisplay";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { useTranslation } from "~/context/Locale";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import InfoModal, { type ModalInfo } from "~/modals/Info";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { isStakingEnabled } from "./Staking/isStakingEnabled";

type InfoName = "staked" | "unstaking" | "claimable";

function AleoStakingSummary({ account }: { readonly account: AleoAccount }) {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const position = useStakingPosition(account);
  const [infoName, setInfoName] = useState<InfoName>();
  const info = useMemo(() => getInfo(t), [t]);

  const onCloseModal = useCallback(() => setInfoName(undefined), []);
  const onPressInfoCreator = useCallback((name: InfoName) => () => setInfoName(name), []);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16 }}>
      <InfoModal
        isOpened={!!infoName}
        onClose={onCloseModal}
        data={infoName ? info[infoName] : []}
      />
      <Box style={{ flexDirection: "row" }}>
        <InfoItem
          title={t("aleo.stake.staked")}
          onPress={onPressInfoCreator("staked")}
          value={<CurrencyUnitValue unit={unit} value={position.bondedBalance} />}
        />
        <InfoItem
          title={t("aleo.stake.unstaking")}
          onPress={onPressInfoCreator("unstaking")}
          value={<CurrencyUnitValue unit={unit} value={getUnstakingBalance(position)} />}
        />
        <InfoItem
          isLast
          title={t("aleo.stake.claimable")}
          onPress={onPressInfoCreator("claimable")}
          value={<CurrencyUnitValue unit={unit} value={position.claimableBalance} />}
        />
      </Box>
    </ScrollView>
  );
}

/**
 * The account screen calls this as a plain function and hides the whole "Earn" section when it
 * returns null, so an empty position has to be ruled out here rather than inside the rendered
 * component.
 */
export default function AccountBalanceSummaryFooter({ account }: { readonly account?: Account }) {
  if (!account || account.type !== "Account") return null;
  const aleoAccount = account as AleoAccount;
  if (!isStakingEnabled(aleoAccount)) return null;
  const { bondedBalance, unbondingBalance } = aleoAccount.aleoResources ?? {};
  if (!bondedBalance?.gt(0) && !unbondingBalance?.gt(0)) return null;
  return <AleoStakingSummary account={aleoAccount} />;
}

function getInfo(t: TFunction<"translation">): Record<InfoName, ModalInfo[]> {
  return {
    staked: [
      { title: t("aleo.info.staked.title"), description: t("aleo.info.staked.description") },
    ],
    unstaking: [
      { title: t("aleo.info.unstaking.title"), description: t("aleo.info.unstaking.description") },
    ],
    claimable: [
      { title: t("aleo.info.claimable.title"), description: t("aleo.info.claimable.description") },
    ],
  };
}

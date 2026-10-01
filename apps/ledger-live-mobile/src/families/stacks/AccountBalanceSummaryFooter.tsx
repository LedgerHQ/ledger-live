import React, { useCallback, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import type { TFunction } from "i18next";
import type { AccountLike } from "@ledgerhq/types-live";
import {
  getStacksStakingPosition,
  getStacksUnlockCycle,
} from "@ledgerhq/live-common/families/stacks/react";
import { isStacksAccount } from "@ledgerhq/live-common/families/stacks/types";
import type { StacksAccount, StakingPosition } from "@ledgerhq/live-common/families/stacks/types";
import { useTranslation } from "~/context/Locale";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import InfoModal, { type ModalInfo } from "~/modals/Info";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";

type InfoName = "available" | "staked" | "unlockCycle";

function StacksStakingSummary({
  account,
  position,
}: Readonly<{ account: StacksAccount; position: StakingPosition }>) {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const [infoName, setInfoName] = useState<InfoName>();
  const info = useMemo(() => getInfo(t), [t]);

  const onCloseModal = useCallback(() => setInfoName(undefined), []);
  const onPressInfoCreator = useCallback((name: InfoName) => () => setInfoName(name), []);
  const unlockCycle = getStacksUnlockCycle(position);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16 }}>
      <InfoModal
        isOpened={!!infoName}
        onClose={onCloseModal}
        data={infoName ? info[infoName] : []}
      />
      <InfoItem
        title={t("account.availableBalance")}
        onPress={onPressInfoCreator("available")}
        value={<CurrencyUnitValue unit={unit} value={account.spendableBalance} disableRounding />}
      />
      <InfoItem
        isLast={unlockCycle === undefined}
        title={t("stacks.account.staked")}
        onPress={onPressInfoCreator("staked")}
        value={<CurrencyUnitValue unit={unit} value={position.amount} disableRounding />}
      />
      {unlockCycle === undefined ? null : (
        <InfoItem
          isLast
          title={t("stacks.account.unlockCycle")}
          onPress={onPressInfoCreator("unlockCycle")}
          value={unlockCycle}
        />
      )}
    </ScrollView>
  );
}

export default function AccountBalanceSummaryFooter({
  account,
}: {
  readonly account?: AccountLike;
}) {
  if (!account || account.type !== "Account" || !isStacksAccount(account)) return null;
  const position = getStacksStakingPosition(account);
  if (!position) return null;
  return <StacksStakingSummary account={account} position={position} />;
}

function getInfo(t: TFunction<"translation">): Record<InfoName, ModalInfo[]> {
  return {
    available: [
      {
        title: t("stacks.info.available.title"),
        description: t("stacks.info.available.description"),
      },
    ],
    staked: [
      {
        title: t("stacks.info.staked.title"),
        description: t("stacks.info.staked.description"),
      },
    ],
    unlockCycle: [
      {
        title: t("stacks.info.unlockCycle.title"),
        description: t("stacks.info.unlockCycle.description"),
      },
    ],
  };
}

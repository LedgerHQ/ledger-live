import React from "react";
import { ScrollView } from "react-native";
import {
  Banner,
  Box,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { UserCheck, UserLock } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import type {
  BalanceTypeOption,
  BalanceTypeScreenViewModel,
} from "../hooks/useBalanceTypeScreenViewModel";

type ReadyViewModel = Extract<BalanceTypeScreenViewModel, { ready: true }>;

type OptionItemProps = Readonly<{
  option: BalanceTypeOption;
  selected: boolean;
  onSelect: (optionId: string) => void;
}>;

function BalanceTypeOptionItem({ option, selected, onSelect }: OptionItemProps) {
  const { t } = useTranslation();
  const icon = option.icon === "lock" ? UserLock : UserCheck;

  return (
    <ListItem
      onPress={() => onSelect(option.id)}
      active={selected}
      testID={`balance-type-${option.id}`}
    >
      <ListItemLeading>
        <Spot appearance="icon" icon={icon} />
        <ListItemContent>
          <ListItemTitle>{t(`send.newSendFlow.${option.translationKey}.title`)}</ListItemTitle>
          <ListItemDescription>
            {t(`send.newSendFlow.${option.translationKey}.subtitle`)}
          </ListItemDescription>
          {option.isZero ? (
            <ListItemDescription
              lx={{ color: "warning" }}
              testID={`balance-type-${option.id}-zero`}
            >
              {t("send.newSendFlow.balanceType.zeroBalance.warning")}
            </ListItemDescription>
          ) : null}
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent lx={{ alignItems: "flex-end" }}>
          {option.formattedCounterValue ? (
            <ListItemTitle>{option.formattedCounterValue}</ListItemTitle>
          ) : null}
          <ListItemDescription>{option.formattedBalance}</ListItemDescription>
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}

type BalanceTypeScreenViewProps = Readonly<{
  viewModel: ReadyViewModel;
}>;

export function BalanceTypeScreenView({ viewModel }: BalanceTypeScreenViewProps) {
  const { t } = useTranslation();
  const { options, onSelect, selectedOptionId } = viewModel;

  return (
    <ScrollView testID="balance-type-screen" showsVerticalScrollIndicator={false}>
      <Box lx={{ gap: "s12" }}>
        {options.map(option => (
          <BalanceTypeOptionItem
            key={option.id}
            option={option}
            selected={option.id === selectedOptionId}
            onSelect={onSelect}
          />
        ))}
      </Box>
      {options
        .filter(option => option.hasPendingBalance)
        .map(option => (
          <Box key={option.id} lx={{ marginTop: "s16" }}>
            <Banner
              appearance="warning"
              title={t(`send.newSendFlow.${option.translationKey}.pendingNoticeTitle`)}
              description={t(`send.newSendFlow.${option.translationKey}.pendingNotice`)}
              testID={`balance-type-${option.id}-pending-notice`}
            />
          </Box>
        ))}
    </ScrollView>
  );
}

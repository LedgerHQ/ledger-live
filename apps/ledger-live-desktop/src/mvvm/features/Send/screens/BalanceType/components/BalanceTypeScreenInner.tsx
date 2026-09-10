import React from "react";
import { useTranslation } from "react-i18next";
import {
  Banner,
  DialogBody,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spot,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import { UserCheck, UserLock } from "@ledgerhq/lumen-ui-react/symbols";
import type {
  BalanceTypeOption,
  BalanceTypeScreenViewModel,
} from "../hooks/useBalanceTypeScreenViewModel";

type ReadyViewModel = Extract<BalanceTypeScreenViewModel, { ready: true }>;

type Props = {
  viewModel: ReadyViewModel;
};

type OptionItemProps = {
  option: BalanceTypeOption;
  onSelect: (optionId: string) => void;
};

function BalanceTypeOptionItem({ option, onSelect }: Readonly<OptionItemProps>) {
  const { t } = useTranslation();
  const IconComponent = option.icon === "lock" ? UserLock : UserCheck;

  return (
    <ListItem onClick={() => onSelect(option.id)} data-testid={`balance-type-${option.id}`}>
      <ListItemLeading>
        <Spot appearance="icon" icon={IconComponent} />
        <ListItemContent>
          <ListItemTitle>{t(`newSendFlow.${option.translationKey}.title`)}</ListItemTitle>
          <ListItemDescription>
            {t(`newSendFlow.${option.translationKey}.subtitle`)}
          </ListItemDescription>
          {option.isZero ? (
            <Tag
              appearance="warning"
              label={t("newSendFlow.balanceType.zeroBalance.warning")}
              data-testid={`balance-type-${option.id}-zero`}
            />
          ) : null}
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent className="items-end text-end">
          {option.formattedCounterValue ? (
            <ListItemTitle>{option.formattedCounterValue}</ListItemTitle>
          ) : null}
          <ListItemDescription>{option.formattedBalance}</ListItemDescription>
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}

export function BalanceTypeScreenInner({ viewModel }: Readonly<Props>) {
  const { t } = useTranslation();
  const { options, onSelect } = viewModel;

  return (
    <DialogBody className="flex flex-col gap-16" data-testid="balance-type-screen">
      <div className="flex flex-col gap-12">
        {options.map(option => (
          <BalanceTypeOptionItem key={option.id} option={option} onSelect={onSelect} />
        ))}
      </div>
      {options
        .filter(option => option.hasPendingBalance)
        .map(option => (
          <Banner
            key={option.id}
            appearance="warning"
            title={t(`newSendFlow.${option.translationKey}.pendingNotice`)}
            data-testid={`balance-type-${option.id}-pending-notice`}
          />
        ))}
    </DialogBody>
  );
}

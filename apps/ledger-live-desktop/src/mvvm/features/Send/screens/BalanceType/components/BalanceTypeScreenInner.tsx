import React from "react";
import { useTranslation } from "react-i18next";
import {
  Banner,
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  DialogBody,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import type {
  BalanceTypeOption,
  BalanceTypeScreenViewModel,
} from "../hooks/useBalanceTypeScreenViewModel";

type ReadyViewModel = Extract<BalanceTypeScreenViewModel, { ready: true }>;

type Props = {
  viewModel: ReadyViewModel;
};

type OptionCardProps = {
  option: BalanceTypeOption;
  selected: boolean;
  onSelect: (optionId: string) => void;
};

function BalanceTypeOptionCard({ option, selected, onSelect }: Readonly<OptionCardProps>) {
  const { t } = useTranslation();

  return (
    <Card
      type="interactive"
      outlined={selected}
      aria-pressed={selected}
      className="flex-1"
      data-testid={`balance-type-${option.id}`}
      onClick={() => onSelect(option.id)}
    >
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle className="whitespace-normal">
              {t(`newSendFlow.${option.translationKey}.title`)}
            </CardContentTitle>
            <CardContentDescription className="whitespace-normal">
              {t(`newSendFlow.${option.translationKey}.subtitle`)}
            </CardContentDescription>
            <CardContentDescription className="whitespace-normal break-words">
              {option.formattedBalance}
            </CardContentDescription>
            {option.isZero ? (
              <Tag
                appearance="warning"
                label={t("newSendFlow.balanceType.zeroBalance.warning")}
                data-testid={`balance-type-${option.id}-zero`}
              />
            ) : null}
          </CardContent>
        </CardLeading>
      </CardHeader>
    </Card>
  );
}

export function BalanceTypeScreenInner({ viewModel }: Readonly<Props>) {
  const { t } = useTranslation();
  const { selectedOptionId, options, onSelect } = viewModel;

  return (
    <DialogBody className="flex flex-col gap-16" data-testid="balance-type-screen">
      <div className="flex gap-16">
        {options.map(option => (
          <BalanceTypeOptionCard
            key={option.id}
            option={option}
            selected={selectedOptionId === option.id}
            onSelect={onSelect}
          />
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

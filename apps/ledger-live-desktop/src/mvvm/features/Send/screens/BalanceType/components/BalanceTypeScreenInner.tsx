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
  BalanceSender,
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
  title: string;
  subtitle: string;
  zeroWarning: string;
  testId: string;
  zeroWarningTestId: string;
  onSelect: (sender: BalanceSender) => void;
};

function BalanceTypeOptionCard({
  option,
  selected,
  title,
  subtitle,
  zeroWarning,
  testId,
  zeroWarningTestId,
  onSelect,
}: OptionCardProps) {
  return (
    <Card
      type="interactive"
      outlined={selected}
      aria-pressed={selected}
      className="flex-1"
      data-testid={testId}
      onClick={() => onSelect(option.sender)}
    >
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle className="whitespace-normal">{title}</CardContentTitle>
            <CardContentDescription className="whitespace-normal">
              {subtitle}
            </CardContentDescription>
            <CardContentDescription className="whitespace-normal break-words">
              {option.formattedBalance}
            </CardContentDescription>
            {option.isZero ? (
              <Tag appearance="warning" label={zeroWarning} data-testid={zeroWarningTestId} />
            ) : null}
          </CardContent>
        </CardLeading>
      </CardHeader>
    </Card>
  );
}

export function BalanceTypeScreenInner({ viewModel }: Props) {
  const { t } = useTranslation();
  const { selectedSender, transparentOption, shieldedOption, onSelect } = viewModel;

  return (
    <DialogBody className="flex flex-col gap-16" data-testid="balance-type-screen">
      <div className="flex gap-16">
        <BalanceTypeOptionCard
          option={transparentOption}
          selected={selectedSender === "public"}
          title={t("newSendFlow.balanceType.transparent.title")}
          subtitle={t("newSendFlow.balanceType.transparent.subtitle")}
          zeroWarning={t("newSendFlow.balanceType.zeroBalance.warning")}
          testId="balance-type-transparent"
          zeroWarningTestId="balance-type-transparent-zero"
          onSelect={onSelect}
        />
        <BalanceTypeOptionCard
          option={shieldedOption}
          selected={selectedSender === "private"}
          title={t("newSendFlow.balanceType.shielded.title")}
          subtitle={t("newSendFlow.balanceType.shielded.subtitle")}
          zeroWarning={t("newSendFlow.balanceType.zeroBalance.warning")}
          testId="balance-type-shielded"
          zeroWarningTestId="balance-type-shielded-zero"
          onSelect={onSelect}
        />
      </div>
      {shieldedOption.hasMaturingNotes ? (
        <Banner
          appearance="warning"
          title={t("newSendFlow.balanceType.shielded.maturingNotice")}
          data-testid="balance-type-maturing-notice"
        />
      ) : null}
    </DialogBody>
  );
}

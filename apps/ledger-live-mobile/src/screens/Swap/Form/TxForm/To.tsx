import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
import { getAccountName } from "@ledgerhq/live-common/lib/account";
import { SwapSelectorStateType } from "@ledgerhq/live-common/lib/exchange/swap/types";
import CurrencyIcon from "../../../../components/CurrencyIcon";
import { Selector } from "./Selector";

interface Props {
  to: SwapSelectorStateType;
}

export function To({ to: { account, currency } }: Props) {
  const { t } = useTranslation();

  const name = useMemo(() => (account && getAccountName(account)) ?? "", [
    account,
  ]);

  return (
    <Flex>
      <Text>{t("transfer.swap2.form.from")}</Text>
      <Selector
        Icon={<CurrencyIcon size={20} currency={currency} />}
        title={name}
        subTitle={currency?.units[0].code ?? ""}
      />
    </Flex>
  );
}

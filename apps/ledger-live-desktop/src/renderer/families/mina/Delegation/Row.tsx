import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { MinaAccount } from "@ledgerhq/live-common/families/mina/types";
import Box from "~/renderer/components/Box/Box";
import DropDown, { DropDownItem } from "~/renderer/components/DropDownSelector";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import ChevronRight from "~/renderer/icons/ChevronRight";
import { TableLine } from "./Header";
import Discreet from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
`;

const Column = styled(TableLine).attrs<{ strong?: boolean }>(p => ({
  ff: "Inter|SemiBold",
  color: p.strong ? "neutral.c100" : "neutral.c80",
  fontSize: 3,
}))<{ strong?: boolean }>``;

const Ellipsis = styled.div`
  flex: 1;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type Action = { key: "redelegate" | "undelegate"; label: string };

const ManageDropDownItem = ({ item, isActive }: { item: Action; isActive: boolean }) => (
  <ToolTip content={null} containerStyle={{ maxWidth: "100%" }}>
    <DropDownItem isActive={isActive}>
      <Box horizontal alignItems="center" justifyContent="center">
        <Text ff="Inter|SemiBold">{item.label}</Text>
      </Box>
    </DropDownItem>
  </ToolTip>
);

type Props = {
  account: MinaAccount;
  onRedelegate: () => void;
  onUndelegate: () => void;
};

export function Row({ account, onRedelegate, onUndelegate }: Props) {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);

  const actions: Action[] = [
    { key: "redelegate", label: t("mina.delegation.redelegate") },
    { key: "undelegate", label: t("mina.delegation.undelegate") },
  ];
  const { delegateInfo } = account.resources ?? {};

  const validatorName = delegateInfo?.identityName ?? delegateInfo?.address ?? "-";

  const formattedAmount = formatCurrencyUnit(unit, account.balance, {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  });

  const onSelect = useCallback(
    (action: Action) => {
      if (action.key === "redelegate") {
        onRedelegate();
      } else {
        onUndelegate();
      }
    },
    [onRedelegate, onUndelegate],
  );

  return (
    <Wrapper>
      <Column strong>
        <Box mr={1}>
          <FirstLetterIcon label={validatorName} />
        </Box>
        <Ellipsis>{validatorName}</Ellipsis>
      </Column>
      <Column>
        <Discreet>{formattedAmount}</Discreet>
      </Column>
      <Column>
        <DropDown items={actions} renderItem={ManageDropDownItem} onChange={onSelect}>
          {() => (
            <Box flex="1" horizontal alignItems="center">
              <Trans i18nKey="common.manage" />
              <div style={{ transform: "rotate(90deg)" }}>
                <ChevronRight size={16} />
              </div>
            </Box>
          )}
        </DropDown>
      </Column>
    </Wrapper>
  );
}

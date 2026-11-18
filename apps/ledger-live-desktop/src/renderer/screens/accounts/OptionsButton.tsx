import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Track } from "@shared/analytics-react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import DropDownSelector, {
  DropDownItem,
  DropDownItemType,
} from "~/renderer/components/DropDownSelector";
import Switch from "~/renderer/components/Switch";
import Tooltip from "~/renderer/components/Tooltip";
import { useHideEmptyTokenAccounts } from "~/renderer/actions/settings";
import { Icons } from "@ledgerhq/react-ui";

const Item = styled(DropDownItem)<{ disableHover?: boolean }>`
  width: 230px;
  cursor: pointer;
  white-space: pre-wrap;
  justify-content: flex-start;
  align-items: center;
`;
type ItemType = DropDownItemType & {
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
};
const OptionsButton = () => {
  const [hideEmptyTokenAccounts, setHideEmptyTokenAccounts] = useHideEmptyTokenAccounts();
  const { t } = useTranslation();

  const items: ItemType[] = [
    {
      key: "hideEmpty",
      label: t("settings.accounts.hideEmptyTokens.title"),
      onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
        e.stopPropagation();
        setHideEmptyTokenAccounts(!hideEmptyTokenAccounts);
      },
    },
  ];
  const renderItem = ({ item }: { item: ItemType }) => {
    return (
      <Item
        id={`accounts-button-${item.key}`}
        isActive={false}
        horizontal
        flow={2}
        onClick={e => (item.onClick ? item.onClick(e) : undefined)}
        disableHover={item.key === "hideEmpty"}
      >
        {item.key === "hideEmpty" ? (
          <Box mr={4}>
            <Track
              onUpdate
              event={
                hideEmptyTokenAccounts
                  ? "hideEmptyTokenAccountsEnabled"
                  : "hideEmptyTokenAccountsDisabled"
              }
            />
            <Switch isChecked={hideEmptyTokenAccounts} onChange={setHideEmptyTokenAccounts} />
          </Box>
        ) : null}
        {item.label}
      </Item>
    );
  };
  return (
    <DropDownSelector buttonId="accounts-options-button" items={items} renderItem={renderItem}>
      {() => (
        <Box horizontal>
          <Tooltip content={t("accounts.optionsMenu.title")}>
            <Button
              small
              outlineGrey
              style={{
                width: 34,
                padding: 0,
                justifyContent: "center",
              }}
            >
              <Box alignItems="center">
                <Icons.MoreHorizontal size={"S"} />
              </Box>
            </Button>
          </Tooltip>
        </Box>
      )}
    </DropDownSelector>
  );
};
export default React.memo(OptionsButton);

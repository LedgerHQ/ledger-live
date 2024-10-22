import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import Track from "~/renderer/analytics/Track";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import DropDownSelector, {
  DropDownItem,
  DropDownItemType,
} from "~/renderer/components/DropDownSelector";
import Switch from "~/renderer/components/Switch";
import Tooltip from "~/renderer/components/Tooltip";
import { openModal } from "~/renderer/actions/modals";
import { useHideEmptyTokenAccounts } from "~/renderer/actions/settings";
import { Icons } from "@ledgerhq/react-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { setDrawerVisibility as setLedgerSyncDrawerVisibility } from "~/renderer/actions/walletSync";
import { useFlows } from "LLD/features/WalletSync/hooks/useFlows";
import {
  AnalyticsPage,
  useLedgerSyncAnalytics,
} from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";

const Separator = styled.div`
  background-color: ${p => p.theme.colors.palette.divider};
  height: 1px;
  margin-top: 8px;
  margin-bottom: 8px;
`;
const Item = styled(DropDownItem)<{ disableHover?: boolean }>`
  width: 230px;
  cursor: pointer;
  white-space: pre-wrap;
  justify-content: flex-start;
  align-items: center;
`;
type ItemType = DropDownItemType & {
  icon?: JSX.Element;
  onClick?: Function;
  type?: "separator";
};
const OptionsButton = () => {
  const dispatch = useDispatch();
  const [hideEmptyTokenAccounts, setHideEmptyTokenAccounts] = useHideEmptyTokenAccounts();
  const onOpenModal = useCallback(
    (modal: "MODAL_EXPORT_ACCOUNTS" | "MODAL_EXPORT_OPERATIONS") => {
      dispatch(openModal(modal, undefined));
    },
    [dispatch],
  );
  const { t } = useTranslation();

  const lldLedgerSyncFF = useFeature("lldWalletSync");
  const isLedgerSyncEnabled = lldLedgerSyncFF?.enabled;
  const { goToWelcomeScreenWalletSync } = useFlows();

  const { onClickTrack } = useLedgerSyncAnalytics();

  const openLedgerSyncDrawer = () => {
    goToWelcomeScreenWalletSync();
    onClickTrack({ button: "Access Ledger Sync", page: AnalyticsPage.Accounts });
    dispatch(setLedgerSyncDrawerVisibility(true));
  };
  const items: ItemType[] = [
    {
      key: "exportOperations",
      label: t("accounts.optionsMenu.exportOperations"),
      icon: <Icons.Download size="S" />,
      onClick: () => onOpenModal("MODAL_EXPORT_OPERATIONS"),
    },
    ...(isLedgerSyncEnabled
      ? [
          {
            key: "exportAccounts",
            label: t("accounts.optionsMenu.ledgerSync"),
            icon: <Icons.Refresh size="S" />,
            onClick: openLedgerSyncDrawer,
          },
        ]
      : [
          {
            key: "exportAccounts",
            label: t("accounts.optionsMenu.exportToMobile"),
            icon: <Icons.QrCode size="S" />,
            onClick: () => onOpenModal("MODAL_EXPORT_ACCOUNTS"),
          },
        ]),
    {
      key: "sep1",
      type: "separator",
      label: "",
    },
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
    if (item.type === "separator") {
      return <Separator />;
    }
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
        ) : item.icon ? (
          <Box mr={4}>{item.icon}</Box>
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
              flow={1}
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
export default React.memo<{}>(OptionsButton);

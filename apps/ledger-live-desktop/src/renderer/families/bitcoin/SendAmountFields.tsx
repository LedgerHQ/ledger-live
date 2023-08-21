import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useFeesStrategy } from "@ledgerhq/live-common/families/bitcoin/react";
import { Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { track } from "~/renderer/analytics/segment";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import SelectFeeStrategy from "~/renderer/components/SelectFeeStrategy";
import SendFeeMode from "~/renderer/components/SendFeeMode";
import Text from "~/renderer/components/Text";
import Tooltip from "~/renderer/components/Tooltip";
import { context } from "~/renderer/drawers/Provider";
import CoinControlModal from "./CoinControlModal";
import { FeesField } from "./FeesField";
import { BitcoinFamily } from "./types";
import useBitcoinPickingStrategy from "./useBitcoinPickingStrategy";

type Props = NonNullable<BitcoinFamily["sendAmountFields"]>["component"];

const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${p => p.theme.colors.palette.text.shade10};
  margin: 20px 0;
`;
const Fields: Props = ({
  transaction,
  account,
  parentAccount,
  onChange,
  status,
  updateTransaction,
  mapStrategies,
  trackProperties = {},
}) => {
  const bridge = getAccountBridge(account);
  const { t } = useTranslation();
  const { state: drawerState, setDrawer } = React.useContext(context);
  const [coinControlOpened, setCoinControlOpened] = useState(false);
  const [isAdvanceMode, setAdvanceMode] = useState(!transaction.feesStrategy);
  const strategies = useFeesStrategy(account, transaction);
  const onCoinControlOpen = useCallback(() => setCoinControlOpened(true), []);
  const onCoinControlClose = useCallback(() => setCoinControlOpened(false), []);
  const { item } = useBitcoinPickingStrategy(transaction.utxoStrategy.strategy);
  const canNext = account.bitcoinResources?.utxos?.length;

  /* TODO: How do we set default RBF to be true ? (@gre)
   * Meanwhile, using this trick (please don't kill me)
   */
  useEffect(() => {
    updateTransaction((t: Transaction) =>
      bridge.updateTransaction(t, {
        rbf: true,
      }),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onFeeStrategyClick = useCallback(
    ({ amount, feesStrategy }) => {
      track("button_clicked", {
        ...trackProperties,
        button: feesStrategy,
        feePerByte: amount,
      });
      updateTransaction((transaction: Transaction) =>
        bridge.updateTransaction(transaction, {
          feePerByte: amount,
          feesStrategy,
        }),
      );
      if (drawerState.open) setDrawer(undefined);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateTransaction, bridge],
  );
  const setAdvanceModeAndTrack = useCallback(
    state => {
      track("button_clicked", {
        ...trackProperties,
        button: state ? "advanced" : "standard",
      });
      setAdvanceMode(state);
    },
    [trackProperties],
  );
  const onChangeAndTrack = useCallback(
    params => {
      track("button_clicked", {
        ...trackProperties,
        button: "fees",
        value: params,
      });
      onChange(params);
    },
    [onChange, trackProperties],
  );
  return (
    <>
      <SendFeeMode isAdvanceMode={isAdvanceMode} setAdvanceMode={setAdvanceModeAndTrack} />
      {isAdvanceMode ? (
        <Box>
          <FeesField
            transaction={transaction}
            account={account}
            onChange={onChangeAndTrack}
            status={status}
          />
          <Separator />
          <Box flow={2}>
            <Box horizontal alignItems="center">
              <Box>
                <Text ff="Inter|Regular" fontSize={12} color="palette.text.shade50">
                  {t("bitcoin.strategy")}
                </Text>
                <Text ff="Inter|Regular" fontSize={13} color="palette.text.shade100">
                  {item ? item.label : null}
                </Text>
              </Box>
              <Box grow />
              <Box horizontal alignItems="center">
                {canNext ? (
                  <Button secondary onClick={onCoinControlOpen} disabled={!canNext}>
                    {t("bitcoin.coincontrol")}
                  </Button>
                ) : (
                  <Tooltip content={t("bitcoin.ctaDisabled")}>
                    <Button secondary onClick={onCoinControlOpen} disabled={!canNext}>
                      {t("bitcoin.coincontrol")}
                    </Button>
                  </Tooltip>
                )}
              </Box>
            </Box>
            <Separator />
            <CoinControlModal
              transaction={transaction}
              account={account}
              onChange={onChangeAndTrack}
              status={status}
              isOpened={coinControlOpened}
              onClose={onCoinControlClose}
              updateTransaction={updateTransaction}
            />
          </Box>
        </Box>
      ) : (
        <SelectFeeStrategy
          strategies={strategies}
          onClick={onFeeStrategyClick}
          transaction={transaction}
          account={account}
          parentAccount={parentAccount}
          suffixPerByte={true}
          mapStrategies={mapStrategies}
        />
      )}
    </>
  );
};
export default {
  component: Fields,
  fields: ["feePerByte", "rbf"],
};

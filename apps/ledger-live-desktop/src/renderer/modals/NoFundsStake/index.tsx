import React, { useCallback, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon, Text } from "@ledgerhq/react-ui";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { getAllSupportedCryptoCurrencyTickers } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { useProviders } from "~/renderer/screens/exchange/Swap2/Form";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import EntryButton from "~/renderer/components/EntryButton/EntryButton";
import CoinsIcon from "./assets/CoinsIcon";
import { page, track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";

interface NoFundsStakeModalProps {
  account: AccountLike;
  parentAccount?: Account;
}

const NoFundsStakeModal = ({ account, parentAccount }: NoFundsStakeModalProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useHistory();

  const rampCatalog = useRampCatalog();
  const { providers, storedProviders } = useProviders();

  const onRampAvailableTickers = useMemo(() => {
    if (!rampCatalog.value) {
      return [];
    }
    return getAllSupportedCryptoCurrencyTickers(rampCatalog.value.onRamp);
  }, [rampCatalog.value]);

  const swapAvailableIds = useMemo(() => {
    return providers || storedProviders
      ? (providers || storedProviders)
          .map(({ pairs }) => pairs.map(({ from, to }) => [from, to]))
          .flat(2)
      : [];
  }, [providers, storedProviders]);

  const currency = parentAccount?.currency || account.currency;
  const availableOnBuy = currency && onRampAvailableTickers.includes(currency.ticker.toUpperCase());
  const availableOnSwap = useMemo(() => {
    return currency && swapAvailableIds.includes(currency.id);
  }, [currency, swapAvailableIds]);

  const availableOnReceive = true;

  const modalName = "MODAL_NO_FUNDS_STAKE";

  const onBuy = useCallback(() => {
    track("button_clicked", {
      button: "buy",
      page: history.location.pathname,
      ...stakeDefaultTrack,
    });

    dispatch(closeModal(modalName));

    history.push({
      pathname: "/exchange",
      state: {
        currency: currency.id,
        mode: "buy",
      },
    });
  }, [currency, history, dispatch]);

  const onSwap = useCallback(() => {
    track("button_clicked", {
      button: "swap",
      page: history.location.pathname,
      ...stakeDefaultTrack,
    });

    dispatch(closeModal(modalName));

    history.push({
      pathname: "/swap",
      state: {
        defaultCurrency: currency,
        defaultAccount: account,
        defaultParentAccount: parentAccount,
      },
    });
  }, [currency, account, parentAccount, history, dispatch]);

  const onReceive = useCallback(() => {
    track("button_clicked", {
      button: "receive",
      page: history.location.pathname,
      ...stakeDefaultTrack,
    });

    dispatch(closeModal(modalName));

    dispatch(openModal("MODAL_RECEIVE", { parentAccount, account }));
  }, [parentAccount, account, dispatch, history]);

  const onClose = useCallback(() => {
    dispatch(closeModal(modalName));
  }, [dispatch]);

  useEffect(() => {
    page("Stake", "Service_modal", {
      source: history.location.pathname,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal name={modalName} centered>
      <ModalBody
        title={t("stake.noFundsModal.title")}
        onClose={onClose}
        render={() => (
          <Box paddingX={20}>
            <Box alignItems="center" mb={24}>
              <CoinsIcon />
            </Box>
            <Box textAlign="center" mb={16}>
              <Text fontWeight="semiBold">
                {t("stake.noFundsModal.text", { coin: currency.ticker })}
              </Text>
            </Box>
            <Box textAlign="center" mb={24}>
              <Text fontSize={13} fontWeight="regular" color="neutral.c70">
                {t("stake.noFundsModal.description")}
              </Text>
            </Box>
            {availableOnBuy && (
              <EntryButton
                Icon={() => <Icon name="BuyCryptoAlt" />}
                title={t("stake.noFundsModal.options.buy.title")}
                body={t("stake.noFundsModal.options.buy.body")}
                onClick={onBuy}
                showChevron
              />
            )}
            {availableOnSwap && (
              <EntryButton
                Icon={() => <Icon name="BuyCrypto" />}
                title={t("stake.noFundsModal.options.swap.title")}
                label={t("stake.noFundsModal.options.swap.label")}
                body={t("stake.noFundsModal.options.swap.body")}
                onClick={onSwap}
                showChevron
              />
            )}
            {availableOnReceive && (
              <EntryButton
                Icon={() => <Icon name="ArrowToBottom" />}
                title={t("stake.noFundsModal.options.receive.title")}
                body={t("stake.noFundsModal.options.receive.body")}
                onClick={onReceive}
                showChevron
              />
            )}
          </Box>
        )}
      />
    </Modal>
  );
};

export default NoFundsStakeModal;

import React, { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Icon, Text } from "@ledgerhq/react-ui";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { getAllSupportedCryptoCurrencyTickers } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import { Account, AccountLike } from "~/../../../libs/ledgerjs/packages/types-live/lib";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { useProviders } from "~/renderer/screens/exchange/Swap2/Form";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import EntryButton from "~/renderer/components/EntryButton/EntryButton";
import CoinsIcon from "./assets/CoinsIcon";
import { useHistory } from "react-router-dom";

interface StakeModalProps {
  account: AccountLike;
  parentAccount?: Account;
}

const StakeModal = ({ account, parentAccount }: StakeModalProps) => {
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

  const modalName = "MODAL_STAKE";

  const onBuy = useCallback(() => {
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
    dispatch(closeModal(modalName));
    dispatch(openModal("MODAL_RECEIVE", { parentAccount, account }));
  }, [parentAccount, account, dispatch]);

  const onClose = useCallback(() => {
    dispatch(closeModal(modalName));
  }, [dispatch]);

  return (
    <Modal name={modalName} centered>
      <ModalBody
        title={t("stake.modal.title")}
        onClose={onClose}
        render={() => (
          <Box paddingX={20}>
            <Box alignItems="center" mb={24}>
              <CoinsIcon />
            </Box>
            <Box textAlign="center" mb={16}>
              <Text fontWeight="semiBold">{t("stake.modal.text", { coin: currency.ticker })}</Text>
            </Box>
            <Box textAlign="center" mb={24}>
              <Text fontSize={13} fontWeight="regular" color="neutral.c70">
                {t("stake.modal.description")}
              </Text>
            </Box>
            {availableOnBuy && (
              <EntryButton
                Icon={() => <Icon name="BuyCryptoAlt" />}
                title={t("stake.modal.options.buy.title")}
                body={t("stake.modal.options.buy.body")}
                onClick={onBuy}
                showChevron
              />
            )}
            {availableOnSwap && (
              <EntryButton
                Icon={() => <Icon name="BuyCrypto" />}
                title={t("stake.modal.options.swap.title")}
                label={t("stake.modal.options.swap.label")}
                body={t("stake.modal.options.swap.body")}
                onClick={onSwap}
                showChevron
              />
            )}
            {availableOnReceive && (
              <EntryButton
                Icon={() => <Icon name="ArrowToBottom" />}
                title={t("stake.modal.options.receive.title")}
                body={t("stake.modal.options.receive.body")}
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

export default StakeModal;

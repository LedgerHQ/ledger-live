import React, { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Icon, Text } from "@ledgerhq/react-ui";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { getAllSupportedCryptoCurrencyTickers } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import { Account, AccountLike } from "~/../../../libs/ledgerjs/packages/types-live/lib";
import { closeModal } from "~/renderer/actions/modals";
import { useProviders } from "~/renderer/screens/exchange/Swap2/Form";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import EntryButton from "~/renderer/components/EntryButton/EntryButton";
import CoinsIcon from "./assets/CoinsIcon";

interface StakeModalProps {
  account: AccountLike;
  parentAccount?: Account;
}

const StakeModal = ({ account, parentAccount }: StakeModalProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const rampCatalog = useRampCatalog();
  const { providers, storedProviders } = useProviders();

  const onRampAvailableTickers = useMemo(() => {
    if (!rampCatalog.value) {
      return [];
    }
    return getAllSupportedCryptoCurrencyTickers(rampCatalog.value.onRamp);
  }, [rampCatalog.value]);

  const swapAvailableIds =
    providers || storedProviders
      ? (providers || storedProviders)
          .map(({ pairs }: any) => pairs.map(({ from, to }: any) => [from, to]))
          .flat(2)
      : [];

  const currency = parentAccount?.currency || account.currency;
  const availableOnBuy = currency && onRampAvailableTickers.includes(currency.ticker.toUpperCase());
  const availableOnSwap = currency && swapAvailableIds.includes(currency.id);

  const modalName = "MODAL_STAKE";

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
              <Text variant="subhead" fontWeight="semiBold">
                {" "}
                {t("stake.modal.text", { coin: currency.ticker })}
              </Text>
            </Box>
            <Box textAlign="center" mb={24}>
              <Text fontSize={13} fontWeight="regular" color="neutral.c70">
                {t("stake.modal.description")}
              </Text>
            </Box>
            {availableOnBuy && (
              <Box>
                <EntryButton
                  Icon={() => <Icon name="BuyCryptoAlt" />}
                  title={t("stake.modal.options.buy.title")}
                  body={t("stake.modal.options.buy.body")}
                  showChevron
                />
              </Box>
            )}
            {availableOnSwap && (
              <EntryButton
                Icon={() => <Icon name="BuyCrypto" />}
                title={t("stake.modal.options.swap.title")}
                label={t("stake.modal.options.swap.label")}
                body={t("stake.modal.options.swap.body")}
                showChevron
              />
            )}
            <EntryButton
              Icon={() => <Icon name="ArrowToBottom" />}
              title={t("stake.modal.options.receive.title")}
              body={t("stake.modal.options.receive.body")}
              showChevron
            />
          </Box>
        )}
      />
    </Modal>
  );
};

export default StakeModal;

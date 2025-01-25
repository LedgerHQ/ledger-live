import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Trans, useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import {
  UtxoStrategyPicker,
  UtxoPickerHeaderSection,
  Row,
  ExcludeAssetsSection,
  Footer,
} from "./components";
import { Box, Divider, Flex, Text } from "@ledgerhq/react-ui";
import { useCoinControlModalModel, Props } from "./useCoinControlModalModel";
import { Cell, SplitAddress } from "~/renderer/components/OperationsList/AddressCell";
import FormattedVal from "~/renderer/components/FormattedVal";

type ViewProps = ReturnType<typeof useCoinControlModalModel>;

const View: React.FC<ViewProps> = ({
  isOpened,
  account,
  unit,
  bitcoinResources,
  totalExcludedUTXOS,
  bridge,
  error,
  returning,
  transaction,
  utxoStrategy,
  status,
  accountName,
  onClose,
  onChange,
  updateTransaction,
  onClickLink,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Modal
      width={500}
      isOpened={isOpened}
      centered
      onClose={onClose}
      bodyStyle={{
        backgroundColor: colors.background.drawer,
      }}
      preventBackdropClick={false}
    >
      <TrackPage category="Modal" name="BitcoinCoinControl" />
      <ModalBody
        title={<Trans i18nKey="bitcoin.modalTitle" />}
        onClose={onClose}
        render={() => (
          <Flex minHeight={700} flexDirection="column" flex={1} justifyContent="space-between">
            <Box>
              <Flex
                bg="opacityDefault.c05"
                width="100%"
                borderRadius={4}
                color="neutral.c100"
                flexDirection="column"
                mb={4}
                px={3}
                py={2}
              >
                <Text variant="paragraph" flex={1}>
                  {accountName}
                </Text>
                <Cell px={0}>
                  <SplitAddress
                    fontSize={11}
                    color="neutral.c90"
                    value={account.id}
                    ff="Inter|Regular"
                  />
                </Cell>
              </Flex>
              <UtxoStrategyPicker transaction={transaction} bridge={bridge} onChange={onChange} />
              <Flex flex={1} justifyContent="space-between" mt={10}>
                <Text flex={1} variant="body" color="opacityDefault.c50" fontSize={14}>
                  {t("ordinals.coinControl.amountToSend")}
                </Text>
                <Flex>
                  <FormattedVal
                    disableRounding
                    val={status.amount}
                    unit={unit}
                    showCode
                    fontSize={4}
                    ff="Inter|SemiBold"
                    color="palette.text.shade100"
                  />
                </Flex>
              </Flex>
              <Divider my={24} />
              <Flex flexDirection="column" rowGap={24}>
                <UtxoPickerHeaderSection />
                <Flex flexDirection="column" rowGap={2}>
                  {bitcoinResources.utxos.map(utxo => (
                    <Row
                      key={utxo.hash}
                      utxo={utxo}
                      utxoStrategy={utxoStrategy}
                      totalExcludedUTXOS={totalExcludedUTXOS}
                      updateTransaction={updateTransaction}
                      bridge={bridge}
                      status={status}
                      account={account}
                      unit={unit}
                    />
                  ))}
                </Flex>
              </Flex>
            </Box>
            <Box>
              <Divider my={24} />
              <ExcludeAssetsSection />
            </Box>
          </Flex>
        )}
        renderFooter={() =>
          error ? null : (
            <Footer onClickLink={onClickLink} returning={returning} onClose={onClose} />
          )
        }
      />
    </Modal>
  );
};

export const CoinControlModal: React.FC<Props> = props => {
  return <View {...useCoinControlModalModel({ ...props })} />;
};

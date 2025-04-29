import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { makeSetEarnProtocolInfoModalAction } from "~/actions/earn";
import { Track } from "~/analytics";
import { rgba } from "~/colors";
import Circle from "~/components/Circle";
import QueuedDrawer from "~/components/QueuedDrawer";
import { earnProtocolInfoModalSelector } from "~/reducers/earn";

const ICON_CIRCLE_SIZE = 32;
const ICON_SIZE = "XS";
const ICON_SPACING = 16;
const DESCRIPTION_PADDING = 8;

const ICON_PROTOCOL_COLOR = "#97A5EE";
const ICON_APY_COLOR = "#8BBA74";
const ICON_TVL_COLOR = "#F1C247";
const ICON_STRATEGY_COLOR = "#BBB0FF";

export function EarnProtocolInfoDrawer() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [modalOpened, setModalOpened] = useState(false);

  const openModal = useCallback(() => setModalOpened(true), []);

  const closeModal = useCallback(async () => {
    await dispatch(makeSetEarnProtocolInfoModalAction(undefined));
    await setModalOpened(false);
  }, [dispatch]);
  const state = useSelector(earnProtocolInfoModalSelector);

  useEffect(() => {
    if (!modalOpened && state) {
      openModal();
    }
  }, [openModal, modalOpened, state]);

  return (
    <QueuedDrawer isRequestingToBeOpened={modalOpened} onClose={closeModal}>
      <Flex rowGap={32}>
        <Track onMount event="Earn Protocol Info Modal" />
        <Flex rowGap={32} alignItems="center">
          <Text variant="h4" fontFamily="Inter" textAlign="center">
            {t("earn.deposit.protocolInfoModal.title")}
          </Text>

          <Flex alignItems="left" rowGap={24}>
            <Flex flexDirection="row" columnGap={ICON_SPACING} px={DESCRIPTION_PADDING}>
              <Circle size={ICON_CIRCLE_SIZE} bg={rgba(ICON_PROTOCOL_COLOR, 0.1)}>
                <Icons.Protocol size={ICON_SIZE} color={ICON_PROTOCOL_COLOR} />
              </Circle>
              <Flex>
                <Text variant="paragraph" color="neutral.c70">
                  <Text variant="paragraph" fontWeight="semiBold">
                    {t("earn.deposit.protocolInfoModal.items.protocol.highlighted")}
                  </Text>
                  {t("earn.deposit.protocolInfoModal.items.protocol.description")}
                </Text>
              </Flex>
            </Flex>

            <Flex flexDirection="row" columnGap={ICON_SPACING} px={DESCRIPTION_PADDING}>
              <Circle size={ICON_CIRCLE_SIZE} bg={rgba(ICON_APY_COLOR, 0.1)}>
                <Icons.ProtocolApy size={ICON_SIZE} color={ICON_APY_COLOR} />
              </Circle>
              <Flex>
                <Text variant="paragraph" color="neutral.c70">
                  <Text variant="paragraph">
                    {t("earn.deposit.protocolInfoModal.items.apy.highlighted")}
                  </Text>
                  {t("earn.deposit.protocolInfoModal.items.apy.description")}
                </Text>
              </Flex>
            </Flex>

            <Flex flexDirection="row" columnGap={ICON_SPACING} px={DESCRIPTION_PADDING}>
              <Circle size={ICON_CIRCLE_SIZE} bg={rgba(ICON_TVL_COLOR, 0.1)}>
                <Icons.ProtocolTvl size={ICON_SIZE} color={ICON_TVL_COLOR} />
              </Circle>
              <Flex>
                <Text variant="paragraph" color="neutral.c70">
                  <Text variant="paragraph">
                    {t("earn.deposit.protocolInfoModal.items.tvl.highlighted")}
                  </Text>
                  {t("earn.deposit.protocolInfoModal.items.tvl.description")}
                </Text>
              </Flex>
            </Flex>

            <Flex flexDirection="row" columnGap={ICON_SPACING} px={DESCRIPTION_PADDING}>
              <Circle size={ICON_CIRCLE_SIZE} bg={rgba(ICON_STRATEGY_COLOR, 0.1)}>
                <Icons.ProtocolStrategy size={ICON_SIZE} color={ICON_STRATEGY_COLOR} />
              </Circle>
              <Flex rowGap={8}>
                <Text variant="paragraph" color="neutral.c70">
                  <Text variant="paragraph">
                    {t("earn.deposit.protocolInfoModal.items.strategy.highlighted")}
                  </Text>
                  {t("earn.deposit.protocolInfoModal.items.strategy.description0")}
                </Text>
                <Text variant="paragraph" color="neutral.c70">
                  {t("earn.deposit.protocolInfoModal.items.strategy.description1")}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </QueuedDrawer>
  );
}

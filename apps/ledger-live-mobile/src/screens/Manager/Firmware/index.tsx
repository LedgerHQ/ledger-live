import React, { memo, useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { TouchableOpacity, Linking } from "react-native";
import { Trans } from "react-i18next";

import type { State } from "@ledgerhq/live-common/apps/index";

import manager from "@ledgerhq/live-common/manager/index";

import styled from "styled-components/native";
import { Box, Text, Flex, Icons } from "@ledgerhq/native-ui";
import FirmwareUpdateModal from "../Modals/FirmwareUpdateModal";

import { urls } from "../../../config/urls";

import { setAvailableUpdate } from "../../../actions/settings";

type Props = {
  state: State,
  deviceInfo: any,
};

const FirmwareUpdateContainer = styled(Flex).attrs({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  borderRadius: 8,
  padding: 16,
  borderWidth: 1,
  marginTop: 16,
})``;

const FirmwareUpdateInfoButton = styled(Box).attrs({
  width: 40,
  height: 40,
  borderWidth: 1,
  borderRadius: 50,
  alignItems: "center",
  justifyContent: "center",
})``;

const FirmwareOutdatedContainer = styled(Flex).attrs({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  borderRadius: 8,
  padding: 16,
  paddingRight: 16,
  marginTop: 16,
})``;

const FirmwareManager = ({
  state,
  deviceInfo,
}: Props) => {
  const { deviceModel } = state;
  const [firmware, setFirmware] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const dispatch = useDispatch();

  const open = useCallback(() => setOpenModal(true), [setOpenModal]);
  const close = useCallback(() => setOpenModal(false), [setOpenModal]);
  const openSupport = useCallback(() => Linking.openURL(urls.contact), []);

  useEffect(() => {
    async function getLatestFirmwareForDevice() {
      const fw = await manager.getLatestFirmwareForDevice(deviceInfo);

      if (fw) {
        dispatch(setAvailableUpdate(true));
        setFirmware(fw);
      } else {
        dispatch(setAvailableUpdate(false));
        setFirmware(null);
      }
    }

    getLatestFirmwareForDevice();
  }, [deviceInfo, dispatch]);

  const isDeprecated = manager.firmwareUnsupported(deviceModel.id, deviceInfo);

  return (
    <>
        {firmware ? (
          <FirmwareUpdateContainer borderColor="neutral.c40">
            <Text color="neutral.c100" variant="large" fontWeight="semiBold">
                <Trans i18nKey="manager.firmware.latest"/>
            </Text>
            <TouchableOpacity onPress={open}>
                <FirmwareUpdateInfoButton borderColor="neutral.c40">
                  <Icons.InfoMedium size={16} color="neutral.c100"/>
                </FirmwareUpdateInfoButton>
            </TouchableOpacity>
          </FirmwareUpdateContainer>
        ) : isDeprecated ? (
        <FirmwareOutdatedContainer backgroundColor="warning.c30">
            <Icons.CircledAlertMedium size={18} color="warning.c100"/>
            <Flex flexDirection="column" ml={3}>
                <Text color="warning.c100" variant="body" fontWeight="medium">
                    <Trans i18nKey="manager.firmware.outdated"/>
                </Text>
                <TouchableOpacity onPress={openSupport} style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                    <Text color="warning.c100" variant="body" fontWeight="medium" style={{ textDecorationLine: "underline" }} mr={3}>
                        <Trans i18nKey="manager.firmware.contactUs" />
                    </Text>
                    <Icons.ExternalLinkMedium size={14} color="warning.c100" />
                </TouchableOpacity>
            </Flex>
          </FirmwareOutdatedContainer>
        ) : null}
      <FirmwareUpdateModal isOpened={openModal} onClose={close} />
    </>
  );
};

export default memo(FirmwareManager);

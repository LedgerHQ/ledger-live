import React, { useState, useCallback } from "react";
import { Action, State } from "@ledgerhq/live-common/apps/index";
import { Trans } from "react-i18next";

import { Flex, Text } from "@ledgerhq/native-ui";
import { App } from "@ledgerhq/types-live";
import UpdateAllModal from "../Modals/UpdateAllModal";
import AppUpdateStepper from "./AppUpdateStepper";

import Button from "~/components/Button";

type Props = {
  state: State;
  appsToUpdate: App[];
  dispatch: (_: Action) => void;
  isModalOpened?: boolean;
};

const AppUpdateAll = ({ state, appsToUpdate, dispatch, isModalOpened }: Props) => {
  const { updateAllQueue } = state;
  const [modalOpen, setModalOpen] = useState(isModalOpened);

  const openModal = useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = useCallback(() => setModalOpen(false), [setModalOpen]);
  const appsList = appsToUpdate.map(({ name }) => name);
  const updateAll = useCallback(() => {
    dispatch({ type: "updateAll" });
    setModalOpen(false);
  }, [dispatch]);

  return (
    <Flex mt={5}>
      <AppUpdateStepper state={state} />
      {appsToUpdate.length > 0 && updateAllQueue.length <= 0 && (
        <Flex flexDirection="row" alignItems="center" bg="neutral.c30" borderRadius={4} p={6}>
          <Text flex={1} variant="large" fontWeight="semiBold" numberOfLines={2}>
            <Trans
              i18nKey="AppAction.update.title"
              count={appsToUpdate.length}
              values={{ number: appsToUpdate.length }}
            />
          </Text>
          <Flex ml={6} flex={1} flexDirection="row" justifyContent="flex-end">
            <Button
              outline
              type="main"
              onPress={openModal}
              event="ManagerAppUpdateModalOpen"
              iconName="Info"
              mr={3}
            />
            <Button
              type="color"
              onPress={updateAll}
              event="ManagerAppUpdateAll"
              eventProperties={{ appName: appsList }}
              outline={false}
            >
              <Trans i18nKey="AppAction.update.button" />
            </Button>
          </Flex>
          <UpdateAllModal
            isOpened={!!modalOpen}
            installed={state.installed}
            apps={appsToUpdate}
            onClose={closeModal}
            onConfirm={updateAll}
            state={state}
          />
        </Flex>
      )}
    </Flex>
  );
};

export default AppUpdateAll;

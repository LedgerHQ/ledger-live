import React, { useState, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";
import { Trans } from "react-i18next";

import UpdateAllModal from "../Modals/UpdateAllModal";
import LText from "../../../components/LText";
import Touchable from "../../../components/Touchable";
import colors from "../../../colors";
import Info from "../../../icons/Info";
import AppUpdateStepper from "./AppUpdateStepper";

type Props = {
  state: State,
  appsToUpdate: App[],
  dispatch: Action => void,
};

const AppUpdateAll = ({ state, appsToUpdate, dispatch }: Props) => {
  const { updateAllQueue } = state;
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = useCallback(() => setModalOpen(false), [setModalOpen]);
  const appsList = appsToUpdate.map(({ name }) => name);
  const updateAll = useCallback(() => {
    dispatch({ type: "updateAll" });
    setModalOpen(false);
  }, [dispatch]);

  return (
    <View>
      <AppUpdateStepper state={state} />
      {appsToUpdate.length > 0 && updateAllQueue.length <= 0 && (
        <View style={[styles.root]}>
          <Touchable
            style={styles.infoLabel}
            activeOpacity={0.5}
            onPress={openModal}
            event="ManagerAppUpdateModalOpen"
          >
            <LText semiBold style={styles.infoText}>
              <Trans
                i18nKey="AppAction.update.title"
                count={appsToUpdate.length}
                values={{ number: appsToUpdate.length }}
              />
            </LText>
            <Info size={17} color={colors.live} />
          </Touchable>
          <Touchable
            style={styles.button}
            onPress={updateAll}
            event="ManagerAppUpdateAll"
            eventProperties={{ appsList }}
          >
            <LText semiBold style={styles.buttonText}>
              <Trans i18nKey="AppAction.update.button" />
            </LText>
          </Touchable>
          <UpdateAllModal
            isOpened={modalOpen}
            installed={state.installed}
            apps={appsToUpdate}
            onClose={closeModal}
            onConfirm={updateAll}
            state={state}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    height: 60,
    width: "100%",
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightFog,
  },
  infoLabel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    height: 38,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 17,
    color: colors.live,
    marginRight: 6,
  },
  button: {
    flexBasis: "auto",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    paddingHorizontal: 20,
    borderRadius: 4,
    backgroundColor: colors.live,
  },
  buttonText: {
    fontSize: 14,
    color: colors.white,
  },
});

export default AppUpdateAll;

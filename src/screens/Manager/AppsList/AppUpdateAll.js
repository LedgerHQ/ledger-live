import React, { useState, useCallback } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import type { Action } from "@ledgerhq/live-common/lib/apps";
import { Trans } from "react-i18next";

import UpdateAllModal from "../Modals/UpdateAllModal";
import LText from "../../../components/LText";
import colors from "../../../colors";
import Info from "../../../icons/Info";
import AppUpdateStepper from "./AppUpdateStepper";

type Props = {
  appsToUpdate: App[],
  installQueue: string[],
  uninstallQueue: string[],
  dispatch: Action => void,
};

const AppUpdateAll = ({
  appsToUpdate,
  installQueue,
  uninstallQueue,
  dispatch,
}: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [appsUpdating, setAppsUpdating] = useState([]);

  const openModal = useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = useCallback(() => setModalOpen(false), [setModalOpen]);
  const updateAll = useCallback(() => {
    dispatch({ type: "updateAll" });
    setModalOpen(false);
    setAppsUpdating(appsToUpdate);
  }, [appsToUpdate, dispatch]);
  const onUpdateEnd = useCallback(() => setAppsUpdating([]), [setAppsUpdating]);

  return (
    <View>
      <AppUpdateStepper
        appsUpdating={appsUpdating}
        installQueue={installQueue}
        uninstallQueue={uninstallQueue}
        onUpdateEnd={onUpdateEnd}
      />
      {appsToUpdate.length > 0 && appsUpdating.length <= 0 && (
        <View style={[styles.root]}>
          <TouchableOpacity
            style={styles.infoLabel}
            activeOpacity={0.5}
            onPress={openModal}
          >
            <LText semiBold style={styles.infoText}>
              <Trans
                i18nKey="AppAction.update.title"
                values={{ number: appsToUpdate.length }}
              />
            </LText>
            <Info size={17} color={colors.live} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={updateAll}>
            <LText semiBold style={styles.buttonText}>
              <Trans i18nKey="AppAction.update.button" />
            </LText>
          </TouchableOpacity>
          <UpdateAllModal
            isOpened={modalOpen}
            apps={appsToUpdate}
            onClose={closeModal}
            onConfirm={updateAll}
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

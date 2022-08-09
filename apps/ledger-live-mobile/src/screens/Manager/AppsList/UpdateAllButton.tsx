import React, { memo, useState, useCallback } from "react";
import { Trans } from "react-i18next";
import type { App } from "@ledgerhq/types-live";
import { Button } from "@ledgerhq/native-ui";
import UpdateAllModal from "../Modals/UpdateAllModal";
import { State } from "@ledgerhq/live-common/apps/index";

type Props = {
  onUpdateAll: () => void,
  apps: App[],
  state: State,
};

const UpdateAllButton = ({ onUpdateAll, apps, state }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const openModal = useCallback(() => setIsOpened(true), [setIsOpened]);
  const closeModal = useCallback(() => setIsOpened(false), [setIsOpened]);
  const onConfirm = useCallback(() => {
    onUpdateAll();
    setIsOpened(false);
  }, [onUpdateAll, setIsOpened]);

  return (
    <>
      <Button size="small" type="color" onPress={openModal}>
        <Trans i18nKey="manager.update.title" />
      </Button>
      <UpdateAllModal
        isOpened={isOpened}
        onClose={closeModal}
        onConfirm={onConfirm}
        apps={apps}
        state={state}
        installed={state.installed}
      />
    </>
  );
};

export default memo(UpdateAllButton);

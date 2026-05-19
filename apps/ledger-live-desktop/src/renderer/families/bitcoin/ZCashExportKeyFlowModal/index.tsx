import React, { useCallback, useState } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import {
  ZCASH_ACTIVATION_DATE,
  ZCASH_ACTIVATION_DATE_STRING,
} from "@ledgerhq/coin-bitcoin/chain-adapters/zcash/constants";
import type {
  ZcashSyncState,
  ZcashPrivateInfo,
} from "@ledgerhq/coin-bitcoin/chain-adapters/zcash/types";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import Modal from "~/renderer/components/Modal";
import logger from "~/renderer/logger";
import Body from "./Body";
import { StepId } from "./types";
import { syncStateUpdater } from "./sync";

const ExportKeyModal = ({ account }: { account: ZcashAccount }) => {
  const [stepId, setStepId] = useState<StepId>("birthday");
  const [ufvk, setUfvk] = useState<string>("");
  const [ufvkExportError, setUfvkExportError] = useState<Error | undefined | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [birthday, setBirthday] = useState(today);
  const [invalidBirthday, setInvalidBirthday] = useState(false);
  const [syncFromZero, setSyncFromZero] = useState(false);

  const dispatch = useDispatch();

  const saveSyncState = (info: Partial<ZcashPrivateInfo>) => {
    dispatch(
      syncStateUpdater(account, {
        ...info,
      }),
    );
  };

  const handleBirthdayChange = useCallback((value: string) => {
    setBirthday(value);
    if (isNaN(new Date(value).getDate()) || new Date(value) < ZCASH_ACTIVATION_DATE) {
      setInvalidBirthday(true);
      return;
    }
    setInvalidBirthday(false);
  }, []);

  const handleSyncFromZero = useCallback(() => {
    if (!syncFromZero) {
      setBirthday(ZCASH_ACTIVATION_DATE_STRING);
    } else {
      setBirthday(today);
    }
    setInvalidBirthday(false);
    setSyncFromZero(!syncFromZero);
  }, [syncFromZero, today]);

  const onHandleReset = () => {
    setStepId("birthday");
    setUfvk("");
    setUfvkExportError(null);
  };

  const handleUfvkChanged = (ufvk: string, error?: Error | undefined | null) => {
    if (error instanceof UserRefusedOnDevice) {
      logger.critical(error);
    }
    setUfvkExportError(error);
    setUfvk(ufvk);
  };

  const handleEnableShieldedBalance = (nextSyncState: ZcashSyncState) => {
    saveSyncState({
      syncState: nextSyncState,
      ufvk,
      birthday,
    });
  };

  const isModalLocked = ["device", "confirmation"].includes(stepId);

  return (
    <Modal
      name="MODAL_ZCASH_EXPORT_KEY"
      centered
      onHide={onHandleReset}
      preventBackdropClick={isModalLocked}
      width={550}
      render={({ onClose, data }) => (
        <Body
          stepId={stepId}
          ufvk={ufvk}
          ufvkExportError={ufvkExportError}
          onStepIdChanged={setStepId}
          onUfvkChanged={handleUfvkChanged}
          onRetry={onHandleReset}
          onClose={onClose}
          params={data ?? {}}
          birthday={birthday}
          invalidBirthday={invalidBirthday}
          syncFromZero={syncFromZero}
          handleBirthdayChange={handleBirthdayChange}
          handleSyncFromZero={handleSyncFromZero}
          handleEnableShieldedBalance={handleEnableShieldedBalance}
        />
      )}
    />
  );
};

export default ExportKeyModal;

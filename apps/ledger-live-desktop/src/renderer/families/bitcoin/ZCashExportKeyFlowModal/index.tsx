import React, { useCallback, useState } from "react";
import { useDispatch } from "LLD/hooks/redux";

import {
  ZCASH_ACTIVATION_DATE,
  ZCASH_ACTIVATION_DATE_STRING,
} from "@ledgerhq/coin-zcash/constants";
import type { ZcashPrivateInfo } from "@ledgerhq/coin-zcash/network/types";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import Modal from "~/renderer/components/Modal";
import logger from "~/renderer/logger";
import Body from "./Body";
import { StepId } from "./types";
import { syncStateUpdater } from "./sync";
import { useZcashShieldedSync } from "../useZcashShieldedSync";

const ExportKeyModal = ({ account }: { account: ZcashAccount }) => {
  const [stepId, setStepId] = useState<StepId>("birthday");
  const [ufvk, setUfvk] = useState<string>("");
  const [shieldedAddress, setShieldedAddress] = useState<string | null>(null);
  const [ufvkExportError, setUfvkExportError] = useState<Error | undefined | null>(null);

  // The DatePicker's native <input type="date"> shows the user's local calendar day, so
  // "today" must be computed from local date parts -- toISOString() gives the UTC day,
  // which would wrongly reject the user's own local "today" for positive UTC-offset zones.
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [birthday, setBirthday] = useState(today);
  const [invalidBirthday, setInvalidBirthday] = useState(false);
  const [syncFromZero, setSyncFromZero] = useState(false);

  const dispatch = useDispatch();
  const { startShieldedSync } = useZcashShieldedSync(account);

  const saveSyncState = (info: Partial<ZcashPrivateInfo>) => {
    dispatch(
      syncStateUpdater(account, {
        ...info,
      }),
    );
  };

  const handleBirthdayChange = useCallback(
    (value: string) => {
      setBirthday(value);
      if (
        isNaN(new Date(value).getDate()) ||
        new Date(value) < ZCASH_ACTIVATION_DATE ||
        value > today
      ) {
        setInvalidBirthday(true);
        return;
      }
      setInvalidBirthday(false);
    },
    [today],
  );

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
    setShieldedAddress(null);
    setUfvkExportError(null);
  };

  const handleUfvkChanged = (
    viewKey: string,
    shieldedAddr?: string | null,
    error?: Error | undefined | null,
  ) => {
    if ((error as { name?: string })?.name === "UserRefusedOnDevice") {
      logger.critical(error);
    }
    setUfvkExportError(error);
    setUfvk(viewKey);
    setShieldedAddress(shieldedAddr ?? null);
  };

  // Persisting the viewing key is what enables private balance, and "ready" is the
  // only honest state to persist it with: nothing is syncing yet. Starting is
  // delegated to startShieldedSync, the one place that both registers the rxjs
  // subscription and flips syncState to "running". Writing "running" here instead
  // would leave the UI on a 0% spinner no subscription ever advances, and would
  // then be refused by startShieldedSync's own "already running" guard.
  const handleEnableShieldedBalance = ({ startSyncNow }: { startSyncNow: boolean }) => {
    saveSyncState({
      syncState: "ready",
      ufvk,
      birthday,
      shieldedAddress,
    });

    if (startSyncNow) startShieldedSync();
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

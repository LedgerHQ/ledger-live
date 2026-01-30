import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import repairFirmwareUpdate from "@ledgerhq/live-common/hw/firmwareUpdate-repair";
import { useTranslation } from "react-i18next";
import logger from "~/renderer/logger";
import Button, { Props as ButtonProps } from "~/renderer/components/Button";
import RepairModal from "~/renderer/modals/RepairModal";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { Subscription } from "rxjs";

type Props = {
  buttonProps?: ButtonProps;
  onRepair?: (a: boolean) => void;
};

function RepairDeviceButton({ buttonProps, onRepair }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [opened, setOpened] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const subRef = useRef<Subscription | undefined>(undefined);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (subRef.current) {
        subRef.current.unsubscribe();
      }
    };
  }, []);

  const open = useCallback(() => {
    setOpened(true);
    setError(null);
  }, []);

  const close = useCallback(() => {
    if (subRef.current) subRef.current.unsubscribe();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (onRepair) {
      onRepair(false);
    }
    setOpened(false);
    setIsLoading(false);
    setError(null);
    setProgress(0);
  }, [onRepair]);

  const repair = useCallback(
    (version?: string | null) => {
      if (isLoading) return;
      if (onRepair) {
        onRepair(true);
      }
      timeoutRef.current = setTimeout(() => setIsLoading(true), 500);
      subRef.current = repairFirmwareUpdate("", version).subscribe({
        next: patch => {
          if (patch.progress !== undefined) setProgress(patch.progress);
        },
        error: (err: Error) => {
          logger.critical(err);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setError(err);
          setIsLoading(false);
          setProgress(0);
        },
        complete: () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setOpened(false);
          setIsLoading(false);
          setProgress(0);
          setTrackingSource("settings help repair device");
          navigate("/manager");
          if (onRepair) {
            onRepair(false);
          }
        },
      });
    },
    [isLoading, navigate, onRepair],
  );

  return (
    <>
      <Button {...buttonProps} primary onClick={open} event="RepairDeviceButton">
        {t("settings.repairDevice.button")}
      </Button>

      <RepairModal
        cancellable
        analyticsName="RepairDevice"
        isOpened={opened}
        onReject={close}
        repair={repair}
        isLoading={isLoading}
        title={t("settings.repairDevice.title")}
        desc={t("settings.repairDevice.desc")}
        progress={progress}
        error={error}
        enableSomethingElseChoice={false}
      />
    </>
  );
}

export default RepairDeviceButton;

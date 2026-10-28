import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import {
  useBluetoothPairingDialog,
  type BluetoothPairingDialogViewModel,
} from "./useBluetoothPairingDialog";

export function BluetoothPairingDialogView({
  request,
  pin,
  isPinValid,
  onPinChange,
  onConfirm,
  onRefuse,
}: Readonly<BluetoothPairingDialogViewModel>) {
  const { t } = useTranslation();
  const isProvidePin = request?.pairingKind === "providePin";

  return (
    <Dialog open={request !== null} onOpenChange={open => !open && onRefuse()}>
      <DialogContent data-testid="bluetooth-pairing-dialog">
        <DialogHeader
          density="expanded"
          title={t("bluetooth.pairing.title")}
          description={t(
            isProvidePin
              ? "bluetooth.pairing.providePinDescription"
              : "bluetooth.pairing.confirmPinDescription",
          )}
          onClose={onRefuse}
        />
        <DialogBody>
          {isProvidePin ? (
            <TextInput
              label={t("bluetooth.pairing.pinLabel")}
              value={pin}
              onChange={event => onPinChange(event.target.value)}
              inputMode="numeric"
              autoFocus
              className="w-full"
            />
          ) : (
            <p className="heading-2-semi-bold text-center text-base tracking-widest">
              {request?.pin}
            </p>
          )}
        </DialogBody>
        <DialogFooter className="w-full gap-8">
          <Button appearance="gray" size="lg" className="w-full" onClick={onRefuse}>
            {t(isProvidePin ? "common.cancel" : "bluetooth.pairing.refuse")}
          </Button>
          <Button
            appearance="base"
            size="lg"
            className="w-full"
            disabled={isProvidePin && !isPinValid}
            onClick={onConfirm}
          >
            {t(isProvidePin ? "bluetooth.pairing.submit" : "bluetooth.pairing.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BluetoothPairingDialog() {
  return <BluetoothPairingDialogView {...useBluetoothPairingDialog()} />;
}

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spinner,
} from "@ledgerhq/lumen-ui-react";
import {
  useBluetoothDeviceChooser,
  type BluetoothDeviceChooserViewModel,
} from "./useBluetoothDeviceChooser";

export function BluetoothDeviceChooserView({
  isOpen,
  devices,
  onSelect,
  onCancel,
}: Readonly<BluetoothDeviceChooserViewModel>) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onCancel()}>
      <DialogContent data-testid="bluetooth-device-chooser">
        <DialogHeader
          density="expanded"
          title={t("bluetooth.chooser.title")}
          description={t("bluetooth.chooser.description")}
          onClose={onCancel}
        />
        <DialogBody>
          {devices.length === 0 ? (
            <div className="flex items-center gap-12 py-12">
              <Spinner size={24} />
              <p className="body-2 text-muted">{t("bluetooth.chooser.searching")}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {devices.map(device => (
                <ListItem key={device.deviceId} onClick={() => onSelect(device.deviceId)}>
                  <ListItemLeading>
                    <ListItemContent>
                      <ListItemTitle>{device.deviceName}</ListItemTitle>
                    </ListItemContent>
                  </ListItemLeading>
                </ListItem>
              ))}
            </div>
          )}
        </DialogBody>
        <DialogFooter className="w-full">
          <Button appearance="gray" size="lg" className="w-full" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BluetoothDeviceChooser() {
  return <BluetoothDeviceChooserView {...useBluetoothDeviceChooser()} />;
}

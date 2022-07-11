import React, { useState, useCallback } from "react";
import { Button, Flex, Icons, Drawer, Radio } from "@ledgerhq/react-ui";
import Text from "~/renderer/components/Text";
import { DeviceInfo } from "@ledgerhq/live-common/types/manager";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { Language } from "@ledgerhq/live-common/types/languages";
import { command } from "~/renderer/commands";
import { createAction } from "@ledgerhq/live-common/hw/actions/installLanguage";
import { getEnv } from "@ledgerhq/live-common/env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import DeviceAction from "~/renderer/components/DeviceAction";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

const installLanguageExec = command("installLanguage");
const action = createAction(getEnv("MOCK") ? mockedEventEmitter : installLanguageExec);

type Props = {
  isOpen: boolean;
  onClose: () => void;
  deviceInfo: DeviceInfo;
  device: Device;
};

const DeviceLanguageInstallation: React.FC<Props> = ({ isOpen, onClose, deviceInfo, device }: Props) => {
  const availableLanguages = useAvailableLanguagesForDevice(deviceInfo);

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(availableLanguages[0]);
  const [installing, setInstalling] = useState(false);

  const onCloseDrawer = useCallback(() => {
    onClose();
    setInstalling(false);
  }, [onClose, setInstalling]);

  return (
    <Drawer isOpen={isOpen} onClose={onCloseDrawer} title="Device Language" big>
      <Flex flex={1} p={10} flexDirection="column" justifyContent="space-between">
        {installing ? (
          <DeviceAction
            action={action}
            request={selectedLanguage}
          />
        ) : (
          <>
            <Radio
              currentValue={selectedLanguage}
              onChange={setSelectedLanguage}
              name="LanguageSelection"
              containerProps={{ flexDirection: "column", rowGap: "1rem", flex: 1 }}
            >
              {availableLanguages.map(language => (
                <Radio.ListElement
                  containerProps={{ flex: 1, padding: 0 }}
                  label={language}
                  value={language}
                  key={language}
                />
              ))}
            </Radio>
            <Button variant="main" onClick={() => setInstalling(true)}>
              Change Language
            </Button>
          </>
        )}
      </Flex>
    </Drawer>
  );
};

export default DeviceLanguageInstallation;

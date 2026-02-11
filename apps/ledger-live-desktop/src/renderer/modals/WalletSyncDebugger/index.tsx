import React, { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import { Flex } from "@ledgerhq/react-ui";
import TabBar from "~/renderer/components/TabBar";
import { GeneratorLedgerSync } from "~/renderer/screens/settings/sections/Developer/tools/WalletSync/Generator";
import { CheckerLedgerSync } from "~/renderer/screens/settings/sections/Developer/tools/WalletSync/Checker";

const getItems = (t: (a: string) => string) => {
  const items = [
    {
      key: "generator",
      label: t("settings.developer.debugWalletSync.modal.generator.title"),
      value: <GeneratorLedgerSync />,
    },
    {
      key: "checker",
      label: t("settings.developer.debugWalletSync.modal.check.title"),
      value: <CheckerLedgerSync />,
    },
  ];

  return items;
};

const WalletSyncDebugger = () => {
  const { t } = useTranslation();
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const items = useMemo(() => getItems(t), [t]);

  const activeItem = useMemo(() => items[activeTabIndex], [activeTabIndex, items]);

  return (
    <Modal
      name="MODAL_WALLET_SYNC_DEBUGGER"
      centered
      render={({ onClose }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="settings.developer.debugWalletSync.title" />}
          noScroll
          render={() => (
            <>
              <TabBar
                onIndexChange={setActiveTabIndex}
                defaultIndex={activeTabIndex}
                index={activeTabIndex}
                tabs={items.map(i => t(i.label))}
                ids={items.map(i => `walletsync-${i.key}`)}
                separator
                withId
                fullWidth
                fontSize={14}
                height={15}
              />
              <ScrollArea>
                <Flex minHeight={550} flex={1} mt={3} flexDirection="column">
                  {activeItem.value}
                </Flex>
              </ScrollArea>
            </>
          )}
        />
      )}
    />
  );
};
export default WalletSyncDebugger;

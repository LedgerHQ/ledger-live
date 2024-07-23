import React, { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import TabBar from "~/renderer/components/TabBar";
import SpamReport, {
  HookResult as SpamHookResult,
  useHook as useHookSpam,
} from "~/renderer/screens/settings/sections/Developer/SimpleHashTools/SpamReportNtf";
import RefreshMetadata, {
  HookResult as RefreshHookResult,
  useHook as useHookRefresh,
} from "~/renderer/screens/settings/sections/Developer/SimpleHashTools/RefreshMetadata";
import { Flex } from "@ledgerhq/react-ui";
import Button from "~/renderer/components/ButtonV3";

const getItems = (
  t: (a: string) => string,
  hooks: {
    refresh: RefreshHookResult;
    spam: SpamHookResult;
  },
) => {
  const items = [
    {
      key: "spam",
      label: t("settings.experimental.features.testSimpleHash.tabs.spam"),
      value: <SpamReport {...hooks.spam} />,
      onClick: hooks.spam.onClick,
      cta: t("settings.developer.debugSpamNft.report"),
    },
    {
      key: "refresh",
      label: t("settings.experimental.features.testSimpleHash.tabs.refresh"),
      value: <RefreshMetadata {...hooks.refresh} />,
      onClick: hooks.refresh.onClick,
      cta: t("settings.developer.debugRefreshMetadata.refresh"),
    },
  ];

  return items;
};

const SimpleHashToolsDebugger = () => {
  const { t } = useTranslation();
  const metadataHook = useHookRefresh();
  const spamHook = useHookSpam();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const items = useMemo(
    () => getItems(t, { refresh: metadataHook, spam: spamHook }),
    [metadataHook, spamHook, t],
  );

  const activeItem = useMemo(() => items[activeTabIndex], [activeTabIndex, items]);

  return (
    <Modal
      name="MODAL_SIMPLEHASH_TOOLS"
      centered
      render={({ onClose }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="settings.experimental.features.testSimpleHash.title" />}
          noScroll
          render={() => (
            <>
              <TabBar
                onIndexChange={setActiveTabIndex}
                defaultIndex={activeTabIndex}
                index={activeTabIndex}
                tabs={items.map(i => t(i.label))}
                ids={items.map(i => `simplehash-${i.key}`)}
                separator
                withId
                fullWidth
                fontSize={14}
                height={15}
              />
              <ScrollArea>
                <Flex minHeight={550} flex={1} mt={2}>
                  {activeItem.value}
                </Flex>
              </ScrollArea>
            </>
          )}
          renderFooter={() => (
            <Button alignSelf={"flex-start"} mt={3} variant="color" onClick={activeItem.onClick}>
              {activeItem.cta}
            </Button>
          )}
        />
      )}
    />
  );
};
export default SimpleHashToolsDebugger;

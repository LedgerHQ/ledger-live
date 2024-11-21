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
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import Button from "~/renderer/components/ButtonV3";
import SpamScore, {
  HookResult as SpamScoreHookResult,
  useHook as useHookSpamScore,
} from "~/renderer/screens/settings/sections/Developer/SimpleHashTools/SpamScore";

const getItems = (
  t: (a: string) => string,
  hooks: {
    refresh: RefreshHookResult;
    spam: SpamHookResult;
    check: SpamScoreHookResult;
  },
) => {
  const items = [
    {
      key: "spam",
      label: t("settings.developer.debugSimpleHash.testSimpleHash.tabs.spam"),
      value: <SpamReport {...hooks.spam} />,
      onClick: hooks.spam.onClick,
      cta: t("settings.developer.debugSimpleHash.debugSpamNft.report"),
      closeInfo: hooks.spam.closeInfo,
      displayInfo: hooks.spam.displayInfo,
      isLoading: hooks.spam.spamReportMutation.isPending,
    },
    {
      key: "refresh",
      label: t("settings.developer.debugSimpleHash.testSimpleHash.tabs.refresh"),
      value: <RefreshMetadata {...hooks.refresh} />,
      onClick: hooks.refresh.onClick,
      cta: t("settings.developer.debugSimpleHash.debugRefreshMetadata.refresh"),
      closeInfo: hooks.refresh.closeInfo,
      displayInfo: hooks.refresh.displayInfo,
      isLoading: hooks.refresh.refreshMutation.isPending,
    },
    {
      key: "check",
      label: t("settings.developer.debugSimpleHash.testSimpleHash.tabs.check"),
      value: <SpamScore {...hooks.check} />,
      onClick: hooks.check.onClick,
      cta: t("settings.developer.debugSimpleHash.debugCheckSpamScore.check"),
      closeInfo: hooks.check.closeInfo,
      displayInfo: hooks.check.displayInfo,
      isLoading: hooks.check.checkSpamScore.isLoading,
    },
  ];

  return items;
};

const SimpleHashToolsDebugger = () => {
  const { t } = useTranslation();
  const metadataHook = useHookRefresh();
  const spamHook = useHookSpam();
  const spamScoreHook = useHookSpamScore();
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const items = useMemo(
    () => getItems(t, { refresh: metadataHook, spam: spamHook, check: spamScoreHook }),
    [metadataHook, spamHook, spamScoreHook, t],
  );

  const activeItem = useMemo(() => items[activeTabIndex], [activeTabIndex, items]);

  const displayInfo = activeItem.displayInfo;
  const closeInfo = activeItem.closeInfo;

  return (
    <Modal
      name="MODAL_SIMPLEHASH_TOOLS"
      centered
      width={800}
      render={({ onClose }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="settings.developer.debugSimpleHash.testSimpleHash.title" />}
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
                <Flex minHeight={550} flex={1} mt={2} alignItems="center" justifyContent="center">
                  {activeItem.value}
                </Flex>
              </ScrollArea>
            </>
          )}
          renderFooter={() => (
            <>
              {activeItem.isLoading ? (
                <InfiniteLoader />
              ) : displayInfo ? (
                <Button variant="main" onClick={closeInfo}>
                  {t("settings.developer.debugSimpleHash.back")}
                </Button>
              ) : (
                <Button
                  alignSelf={"flex-start"}
                  mt={3}
                  variant="color"
                  onClick={activeItem.onClick}
                >
                  {activeItem.cta}
                </Button>
              )}
            </>
          )}
        />
      )}
    />
  );
};
export default SimpleHashToolsDebugger;

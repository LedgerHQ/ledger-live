import React, { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import TabBar from "~/renderer/components/TabBar";
import { Divider, Flex, Icons } from "@ledgerhq/react-ui";
import ModalHeader from "~/renderer/components/Modal/ModalHeader";
import { TabKey } from "./types";
import { SupportedChains } from "~/renderer/screens/settings/sections/Developer/NftsTools/screens/SupportedChains";
import { MetadataProvider } from "~/renderer/screens/settings/sections/Developer/NftsTools/screens/NMS/MetadataProvider";
import GenerateMockAccountsWithNfts from "~/renderer/screens/settings/sections/Developer/NftsTools/screens/GeneratorsAndDestructors/GenerateMockAccountsWithNfts";
import { useSupportedChainsViewModel } from "~/renderer/screens/settings/sections/Developer/NftsTools/screens/SupportedChains/useSupportedChainsViewModel";
import DeleteAccounts from "~/renderer/screens/settings/sections/Developer/NftsTools/screens/GeneratorsAndDestructors/DeleteAccounts";
import ResetHiddenCollections from "~/renderer/screens/settings/sections/Developer/NftsTools/screens/GeneratorsAndDestructors/ResetHiddenCollections";

const getItems = (
  t: (a: string) => string,
  hooks: {
    supportedChainsViewModel: ReturnType<typeof useSupportedChainsViewModel>;
  },
) => {
  const items = [
    {
      key: TabKey.CONFIG,
      label: t("settings.developer.debugNfts.tabs.config"),
      value: (
        <Flex flexDirection="column" rowGap={2}>
          <SupportedChains {...hooks.supportedChainsViewModel} />
          <MetadataProvider />
        </Flex>
      ),
    },
    {
      key: TabKey.GENERATOR_DESTRUCTOR,
      label: t("settings.developer.debugNfts.tabs.generatorAndDestructor"),
      value: (
        <Flex flexDirection="column" rowGap={2}>
          <ResetHiddenCollections />
          <Divider />
          <GenerateMockAccountsWithNfts />
          <Divider />
          <DeleteAccounts />
        </Flex>
      ),
    },
  ];

  return items;
};

const NftsToolsDebugger = () => {
  const { t } = useTranslation();
  const supportedChainsViewModel = useSupportedChainsViewModel();

  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const items = useMemo(
    () =>
      getItems(t, {
        supportedChainsViewModel,
      }),
    [supportedChainsViewModel, t],
  );

  const activeItem = useMemo(() => items[activeTabIndex], [activeTabIndex, items]);

  return (
    <Modal
      name="MODAL_NFTS_TOOLS"
      centered
      width={1000}
      render={({ onClose }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Header />}
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
              <ScrollAreaContainer isInsideDrawer>{activeItem.value}</ScrollAreaContainer>
            </>
          )}
        />
      )}
    />
  );
};
export default NftsToolsDebugger;

const Header = () => {
  return (
    <ModalHeader>
      <Flex alignItems="center" justifyContent="center" color="primary.c80">
        <Icons.Nft
          size="L"
          style={{
            marginRight: 10,
          }}
        />

        <Trans i18nKey="settings.developer.debugNfts.title" />
      </Flex>
    </ModalHeader>
  );
};

const ScrollAreaContainer = styled(ScrollArea)`
  min-height: 550px;
`;

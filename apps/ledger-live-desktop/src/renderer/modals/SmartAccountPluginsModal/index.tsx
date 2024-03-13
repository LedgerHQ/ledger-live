import React, { useState } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import Modal from "~/renderer/components/Modal";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import { closeModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { Flex, Grid, Icons } from "@ledgerhq/react-ui";
import OptionBox from "./OptionBox";
import Button from "~/renderer/components/Button";

const ButtonGrid = styled(Grid).attrs(() => ({
  columns: 2,
  columnGap: 2,
  rowGap: 2,
}))`
  padding-top: ${p => p.theme.space[4]}px;
  padding-left: ${p => p.theme.space[4]}px;
  padding-right: ${p => p.theme.space[4]}px;
  padding-bottom: ${p => p.theme.space[6]}px;
  background-color: ${p => p.theme.colors.palette.background.default};
  border-radius: 8px;
  max-height: 400px;
  overflow-y: scroll;
`;

export type Props = {
  isOpened: boolean;
  onClose: () => void;
  error?: Error;
  onRetry?: () => void;
  withExportLogs?: boolean;
};

type PluginItem = {
  title: string;
  label?: string;
  description: string;
  icon?: React.ComponentType;
};

type PluginItems = {
  [key: string]: PluginItem;
};

const SmartAccountPluginsModal = ({
  isOpened,
  onClose,
  error,
  onRetry,
  withExportLogs,
  ...props
}: Props) => {
  const dispatch = useDispatch();

  const handleClose = () => dispatch(closeModal("MODAL_SMART_ACCOUNT_PLUGINS"));

  const pluginsItems: PluginItems = {
    deadmanSwitch: {
      title: "Dead Man Switch",
      label: "Popular",
      description: "Transfers the account keys to a another signer after a period of inactivity",
      icon: Icons.Clock,
    },
    zkEmail_recovery: {
      title: "Email Recovery",
      description: "Allow users to recover their account via email, without doxxing the email",
      icon: Icons.At,
    },
    multi_sig: {
      title: "Multi Signature",
      description: "Require multiple signatures to authorize a transaction",
      icon: Icons.LedgerDevices,
    },
    DCA: {
      title: "Dollar Cost Averaging",
      description: "Automatically buy a fixed amount of crypto at regular intervals",
      icon: Icons.DollarConvert,
    },
  };

  const [isSelected, setIsSelected] = useState<{ [key: string]: boolean }>(
    Object.keys(pluginsItems).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
  );

  const setSelected = (key: string) =>
    setIsSelected(prevState => ({ ...prevState, [key]: !prevState[key] }));

  return (
    <Modal
      name="MODAL_SMART_ACCOUNT_PLUGINS"
      backdropColor
      isOpened={isOpened}
      onClose={handleClose}
      centered
      width={800}
    >
      <ModalBody
        {...props}
        title={"Select plugin(s) for your smart account"}
        onClose={handleClose}
        render={() => (
          <>
            <ButtonGrid>
              {Object.keys(pluginsItems).map(key => (
                <OptionBox
                  key={key}
                  title={pluginsItems[key].title}
                  description={pluginsItems[key].description}
                  label={pluginsItems[key].label}
                  icon={pluginsItems[key].icon}
                  setSelected={() => setSelected(key)}
                  isSelected={isSelected[key]}
                />
              ))}
            </ButtonGrid>
          </>
        )}
      />
      <TrackPage category="Modal" name={error && error.name} />
      <Flex width={"100%"} justifyContent={"flex-end"} pb={20} px={30}>
        <Button primary onClick={handleClose}>
          {"Continue"}
        </Button>
      </Flex>
    </Modal>
  );
};
export default SmartAccountPluginsModal;

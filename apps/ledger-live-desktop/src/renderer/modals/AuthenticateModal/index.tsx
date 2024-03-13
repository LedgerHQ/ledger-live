import React, { useState } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Flex, Text, Box } from "@ledgerhq/react-ui";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import Modal from "~/renderer/components/Modal";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import { closeModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { authenticate } from "@ledgerhq/account-abstraction";
import { useTheme } from "styled-components";
export type Props = {
  isOpened: boolean;
  onClose: () => void;
  error?: Error;
  onRetry?: () => void;
  withExportLogs?: boolean;
};

const ErrorModal = ({ isOpened, onClose, error, onRetry, withExportLogs, ...props }: Props) => {
  const colors = useTheme().colors;
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const handleClose = () => dispatch(closeModal("MODAL_AUTHENTICATE_SMART_ACCOUNT"));
  return (
    <Modal
      name={"MODAL_AUTHENTICATE_SMART_ACCOUNT"}
      backdropColor
      isOpened={isOpened}
      onClose={handleClose}
      centered
    >
      <ModalBody
        {...props}
        title={"Create smart account"}
        onClose={handleClose}
        render={() => (
          <Flex
            rowGap={"20px"}
            justifyContent={"center"}
            alignItems={"center"}
            width={"100%"}
            flexDirection={"column"}
            mt={"-20px"}
          >
            <Text textAlign={"center"} color={colors.palette.neutral.c70} fontSize={14}>
              {
                "Please enter your email address so we can send you a link to authenticate your smart account. This will allow you to sign transactions and interact with smart contracts."
              }
            </Text>
            <Flex flexDirection={"row"} columnGap={"20px"} width={"100%"} alignItems={"center"}>
              <Box width={"75%"}>
                <Input placeholder={"Enter your email"} onChange={setEmail} />
              </Box>
              <Box width={"25%"}>
                <Button
                  primary
                  onClick={() => {
                    authenticate(email);
                    handleClose();
                  }}
                >
                  {"Continue"}
                </Button>
              </Box>
            </Flex>
          </Flex>
        )}
      />
      <TrackPage category="Modal" name={error && error.name} />
    </Modal>
  );
};
export default ErrorModal;

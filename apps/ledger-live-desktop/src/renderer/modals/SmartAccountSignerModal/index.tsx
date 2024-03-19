import React, { useEffect, useState } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Box, Flex, Text, Button } from "@ledgerhq/react-ui";
import Modal from "~/renderer/components/Modal";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { addAccount } from "~/renderer/actions/accounts";
import { completeAuthenticate } from "@ledgerhq/account-abstraction";
import { buildAccount } from "./accountStructure";
import GreenSvg from "./greenSvg";
import { Icons } from "@ledgerhq/react-ui";
import { useTheme } from "styled-components";
import TopGradient from "./topGradient";
import FakeLink from "~/renderer/components/FakeLink";
import ModalSpinner from "./modalSpinner";

export type Props = {
  isOpened: boolean;
  onClose: () => void;
  error?: Error;
  onRetry?: () => void;
  withExportLogs?: boolean;
  signer: {
    orgId: string;
    bundle: string;
  };
};

const ErrorModal = ({
  isOpened,
  onClose,
  error,
  onRetry,
  signer,
  withExportLogs,
  ...props
}: Props) => {
  const colors = useTheme().colors;
  const dispatch = useDispatch();
  const [address, setAddress] = useState("");
  const handleClose = () => {
    dispatch(closeModal("MODAL_SMART_ACCOUNT_SIGNER"));
    dispatch(openModal("MODAL_SMART_ACCOUNT_PLUGINS", undefined));
  };
  useEffect(() => {
    completeAuthenticate(signer.orgId, signer.bundle).then(setAddress);
  }, [signer]);

  const [isSpinnerVisible, setSpinnerVisible] = useState(true);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    if (address !== "") {
      setTimeout(() => {
        setSpinnerVisible(false);
      }, 3000);
    }
  }, [address]);

  useEffect(() => {
    if (address !== "") {
      setTimeout(() => {
        setReady(true);
      }, 2500);
    }
  }, [address]);

  return (
    <Modal
      name="MODAL_SMART_ACCOUNT_SIGNER"
      backdropColor
      isOpened={isOpened}
      onClose={handleClose}
      centered
      bodyStyle={{
        padding: "0px",
        width: "430px",
        borderRadius: "12px",
      }}
    >
      <Box py={"36px"} width={"100%"}>
        <Flex flexDirection={"column"} alignItems={"center"} rowGap={32} justifyContent={"center"}>
          {isSpinnerVisible ? (
            <ModalSpinner isReady={isReady} becomeGreen={false} />
          ) : (
            <>
              <Flex flexDirection={"column"} alignItems={"center"} rowGap={16}>
                <Box position={"absolute"} top={"-20px"}>
                  <TopGradient />
                </Box>
                <Flex
                  width={"100%"}
                  position={"absolute"}
                  justifyContent={"end"}
                  right={10}
                  top={10}
                >
                  <Box
                    onClick={handleClose}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#FFFFFF1A",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: "50%",
                      padding: "8px",
                    }}
                  >
                    <Icons.Close size={"XS"} />
                  </Box>
                </Flex>
                <GreenSvg />
                <Text variant={"body"} fontSize={24} textTransform={"none"} ff={"Inter|Medium"}>
                  Your account is ready
                </Text>
                <Flex flexDirection={"column"} alignItems={"center"} rowGap={"8px"}>
                  <Text variant={"body"} fontSize={14} color={colors.neutral.c70}>
                    Your address is{" "}
                  </Text>
                  <Box
                    backgroundColor={"#FFFFFF0D"}
                    style={{ padding: "10px 8px", borderRadius: "48px" }}
                  >
                    <Text color={colors.neutral.c100} variant={"body"} fontSize={14}>
                      {address}
                    </Text>
                  </Box>
                </Flex>
              </Flex>
                {/* TODO: take this */}
              <Button
                style={{ borderRadius: "500px" }}
                variant={"main"}
                onClick={async () => {
                  const account = await buildAccount(address);
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  //@ts-expect-error
                  dispatch(addAccount(account));
                  handleClose();
                }}
              >
                {"Customize your account"}
              </Button>
              <FakeLink color={colors.neutral.c70} fontSize={"13px"}>
                {"Skip"}
              </FakeLink>
            </>
          )}
        </Flex>
      </Box>
      <TrackPage category="Modal" name={error && error.name} />
    </Modal>
  );
};
export default ErrorModal;
/*
<ModalBody
  {...props}
  onClose={handleClose}
  render={() => (
    <Flex flexDirection={"column"} alignItems={"center"} justifyContent={"center"} rowGap={"20px"}>
      <>
        {address === "" ? (
          <Spinner size={30} />
        ) : (
          <>
            <GreenSvg />
            <Text flex={1} color="green" fontSize={18}>
              {"Your smart account has been created successfully !"}
            </Text>
            <Text flex={1} fontSize={13}>
              {"Your Address:"} {address}
            </Text>
            <Flex width={"100%"} justifyContent={"end"}>
              <Button
                primary
                onClick={async () => {
                  const account = await buildAccount(address);
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  //@ts-expect-error
                  dispatch(addAccount(account));
                  handleClose();
                }}
              >
                {"Add account"}
              </Button>
            </Flex>
          </>
        )}
      </>
    </Flex>
  )}
/>;*/

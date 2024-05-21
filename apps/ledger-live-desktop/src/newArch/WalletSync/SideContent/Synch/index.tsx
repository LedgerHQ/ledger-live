import { Box, Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import ButtonV3 from "~/renderer/components/ButtonV3";
import { Flow } from "~/renderer/reducers/walletSync";

const Synch = () => {
  const dispatch = useDispatch();

  const goToActivation = () => {
    dispatch(setFlow(Flow.Activation));
  };

  return (
    <Box>
      <Flex padding="7px" borderRadius="13px" border="1px solid hsla(0, 0%, 100%, 0.05)">
        <Flex
          borderRadius="9px"
          backgroundColor="hsla(248, 100%, 85%, 0.08)"
          padding="5px"
          flexDirection="column"
        >
          <Text color={"red"}>{"Synch COMPONENT"}</Text>

          <ButtonV3 variant="main" onClick={goToActivation}>
            {"Go to activation"}
          </ButtonV3>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Synch;

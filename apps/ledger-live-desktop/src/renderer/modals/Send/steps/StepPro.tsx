import React, { useCallback } from "react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { StepProps } from "../types";
import { Alert, Text, Divider, Flex } from "@ledgerhq/react-ui";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import Label from "~/renderer/components/Label";
import Item from "./Pro/Item";

const StepPro = ({ status, selectedProIndex, setSelectedProIndex }: StepProps) => {
  const wrappedOnSetSelectedProIndex = useCallback(
    newIndex => {
      // Toggle if reclicked;
      setSelectedProIndex(selectedProIndex === newIndex ? null : newIndex);
    },
    [selectedProIndex, setSelectedProIndex],
  );
  if (!status) return null;

  // TODO query the backend for the list of pending transaction approvals.

  const pending = [
    // {
    //   memo: "Yacine wants a new car",
    //   memo2: "Sending 2ETH to yacine.eth",
    //   hash: "5b62bc12aae45ed3acd0152b57516f9d",
    //   validators: [2, 4],
    // },
    // {
    //   memo: "Dany is trying to take over",
    //   memo2: "Sending 99ETH to dany.eth",
    //   hash: "6a4368049aa06f6746138c9f84d7b412",
    //   validators: [1, 3],
    // },
  ];

  return (
    <Box flow={4}>
      {/* <Alert type="secondary" title="Below is a summary of your pending approvals" /> */}
      <Box mt={5}>
        {pending.length ? (
          <>
            {" "}
            <Label>{"Pending approvals"}</Label>
            {pending.map(({ memo, memo2, hash, validators }, index) => (
              <>
                <Item
                  isSelected={selectedProIndex === index}
                  key={hash}
                  hash={hash}
                  memo={memo}
                  memo2={memo2}
                  validators={validators}
                  onClick={() => wrappedOnSetSelectedProIndex(index)}
                />
                {index === pending.length - 1 ? null : <Divider />}
              </>
            ))}
          </>
        ) : (
          <Alert type="info" title="There are no pending approvals, try creating one" />
        )}
      </Box>
    </Box>
  );
};

export const StepProFooter = ({ selectedProIndex, transitionTo }: StepProps) => {
  const onApprove = async () => {
    transitionTo("device");
  };

  const onNewTransaction = async () => {
    transitionTo("recipient");
  };

  return (
    <>
      {selectedProIndex !== null ? (
        <Button id={"send-pro-continue-button"} primary onClick={onApprove}>
          {"Approve operation"}
        </Button>
      ) : (
        <Button id={"send-pro-continue-button"} primary onClick={onNewTransaction}>
          {"New transaction"}
        </Button>
      )}
    </>
  );
};

export default withV3StyleProvider(StepPro);

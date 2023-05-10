import React, { useState, useCallback, useEffect } from "react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { StepProps } from "../types";
import { Alert, Text, Divider, Flex } from "@ledgerhq/react-ui";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import Label from "~/renderer/components/Label";
import Item from "./Pro/Item";
import axios from 'axios';

const StepPro = ({ status, selectedProIndex, setSelectedProIndex }: StepProps) => {
  const wrappedOnSetSelectedProIndex = useCallback(
    newIndex => {
      // Toggle if reclicked;
      setSelectedProIndex(selectedProIndex === newIndex ? null : newIndex);
    },
    [selectedProIndex, setSelectedProIndex],
  );

  const [pending, setPending] = useState([]);

  useEffect(() => {
    axios.get('https://ledger-live-pro.minivault.ledger-sbx.com/router/test_hk7/dashboard')
        .then(response => {
          console.log(response.data);
          const transactions = response.data["pending_transactions"];
          const pendingTransactions = transactions.map(transaction => {
            return {
              memo: transaction.memo,
              hash: transaction.raw_tx,
              validators: [transaction.approvals.length, 3]
            };
          });
          console.log(pendingTransactions);
          setPending(pendingTransactions);
        })
        .catch(error => {
          console.error(error);
        });
  }, []);

  if (!status) return null;

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
      // transitionTo("device"); to do when we have the app
      // api call after the device thinigy
      const data = {
          "pub_key": "CCCCC",
          "raw_tx": "0xdeadbeefe",
          "signature": "0xsig3"
      };
      axios.post("https://ledger-live-pro.minivault.ledger-sbx.com/router/test_hk7/transaction/approve", data)
          .then(response => {
              console.log(response.data);
          })
          .catch(error => {
              console.error(error);
          });
  };

  const onNewTransaction = async () => {
    // transitionTo("recipient"); to do when we have the app
      // api call after the device thinigy
      const data = {
          "memo": "test_txe",
          "pub_key": "CCCCC",
          "raw_tx": "0xdeadbeefertqw",
          "signature": "0xsig3"
      };
      axios.post("https://ledger-live-pro.minivault.ledger-sbx.com/router/test_hk7/transaction/initiate", data)
          .then(response => {
              console.log(response.data);
              // then approve tx
              const approveData = {
                  "pub_key": "CCCCC",
                  "raw_tx": "0xdeadbeefertqw",
                  "signature": "0xsig3w"
              }
              axios.post("https://ledger-live-pro.minivault.ledger-sbx.com/router/test_hk7/transaction/initiate", approveData)
                  .then(response => {
                      console.log(response.data);
                      // then approve tx
                  })
                  .catch(error => {
                      console.error(error);
                  });

          })
          .catch(error => {
              console.error(error);
          });
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

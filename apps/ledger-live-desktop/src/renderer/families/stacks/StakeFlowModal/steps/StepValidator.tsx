import React, { useCallback } from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { Transaction } from "@ledgerhq/live-common/families/stacks/types";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Input from "~/renderer/components/Input";
import Button from "~/renderer/components/Button";
import { StepProps } from "../types";

const MIN_NUM_CYCLES = 1;
const MAX_NUM_CYCLES = 96;

const isPoolAddress = (valAddress: string | undefined): boolean => !!valAddress?.includes(".");

const isValidNumCycles = (numCycles: number | undefined): boolean =>
  typeof numCycles === "number" && numCycles >= MIN_NUM_CYCLES && numCycles <= MAX_NUM_CYCLES;

const StepValidator = ({ account, transaction, onChangeTransaction }: StepProps) => {
  invariant(account, "account is required");
  const bridge = useAccountBridge<Transaction>(account);

  const onChangeValAddress = useCallback(
    (valAddress: string) => {
      if (!transaction) return;
      onChangeTransaction(bridge.updateTransaction(transaction, { valAddress }));
    },
    [bridge, onChangeTransaction, transaction],
  );

  const onChangeNumCycles = useCallback(
    (raw: string) => {
      if (!transaction) return;
      const digits = raw.replace(/\D/g, "");
      const numCycles = digits ? Number(digits) : undefined;
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          familySpecificData: { ...transaction.familySpecificData, numCycles },
        }),
      );
    },
    [bridge, onChangeTransaction, transaction],
  );

  return (
    <Box flow={4} mx={20}>
      <TrackPage
        category="Stake Flow"
        name="Step Validator"
        flow="stake"
        action="delegate"
        currency="stx"
      />
      <Box>
        <Text ff="Inter|Regular" color="neutral.c80" fontSize={4} textAlign="center">
          <Trans i18nKey="stacks.stake.flow.steps.validator.description" />
        </Text>
      </Box>
      <Box mt={24}>
        <Text ff="Inter|Medium" fontSize={3} color="neutral.c70" mb={1}>
          <Trans i18nKey="stacks.stake.flow.steps.validator.poolAddressLabel" />
        </Text>
        <Input
          value={transaction?.valAddress ?? ""}
          onChange={onChangeValAddress}
          placeholder="SP…native-pool-signer-manager"
          data-testid="stacks-stake-pool-address-input"
        />
      </Box>
      <Box>
        <Text ff="Inter|Medium" fontSize={3} color="neutral.c70" mb={1}>
          <Trans i18nKey="stacks.stake.flow.steps.validator.numCyclesLabel" />
        </Text>
        <Input
          value={transaction?.familySpecificData?.numCycles?.toString() ?? ""}
          onChange={onChangeNumCycles}
          placeholder="1"
          data-testid="stacks-stake-num-cycles-input"
        />
      </Box>
    </Box>
  );
};

export const StepValidatorFooter = ({ transaction, bridgePending, transitionTo }: StepProps) => {
  const canNext =
    !bridgePending &&
    isPoolAddress(transaction?.valAddress) &&
    isValidNumCycles(transaction?.familySpecificData?.numCycles);
  return (
    <Box horizontal alignItems="center" justifyContent="flex-end" flow={2} grow>
      <Button
        id="stacks-stake-validator-continue-button"
        primary
        isLoading={bridgePending}
        disabled={!canNext}
        onClick={() => transitionTo("amount")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
};

export default StepValidator;

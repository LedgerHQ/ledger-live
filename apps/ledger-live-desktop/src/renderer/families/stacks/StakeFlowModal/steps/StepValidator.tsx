import React, { useCallback, useState } from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { Transaction } from "@ledgerhq/live-common/families/stacks/types";
import {
  isStacksPoolAddress,
  isValidStacksNumCycles,
} from "@ledgerhq/live-common/families/stacks/react";
import { TrackPage } from "@shared/analytics-react";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Input from "~/renderer/components/Input";
import Button from "~/renderer/components/Button";
import { StepProps } from "../types";

// Whole input or nothing: stripping characters would turn "1.5" into 15, a different lock period
// than the one typed. Anything else leaves numCycles unset, which keeps Continue disabled.
const parseNumCycles = (raw: string): number | undefined => {
  const trimmed = raw.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : undefined;
};

const StepValidator = ({ account, transaction, onChangeTransaction }: StepProps) => {
  invariant(account, "account is required");
  const bridge = useAccountBridge<Transaction>(account);

  const onChangeValAddress = useCallback(
    (valAddress: string) => {
      if (!transaction) return;
      // `mode` travels together with `valAddress` -- see Body.tsx's initial-transaction comment for
      // why the two must not be set apart. That includes clearing the field back to empty: with
      // `mode` left on "delegate", the generic bridge's `getDelegationIntentFields` drops `valAddress`
      // (falsy) while `defaultComputeIntentType` still classifies the intent as staking, so
      // validation reaches `intent.valAddress.includes(...)` on `undefined` and throws.
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          mode: valAddress ? "delegate" : undefined,
          valAddress,
        }),
      );
    },
    [bridge, onChangeTransaction, transaction],
  );

  // The typed text is kept as-is, so an invalid entry stays visible instead of being rewritten.
  const [numCyclesInput, setNumCyclesInput] = useState(
    transaction?.familySpecificData?.numCycles?.toString() ?? "",
  );

  const onChangeNumCycles = useCallback(
    (raw: string) => {
      setNumCyclesInput(raw);
      if (!transaction) return;
      const numCycles = parseNumCycles(raw);
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
          value={numCyclesInput}
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
    isStacksPoolAddress(transaction?.valAddress) &&
    isValidStacksNumCycles(transaction?.familySpecificData?.numCycles);
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

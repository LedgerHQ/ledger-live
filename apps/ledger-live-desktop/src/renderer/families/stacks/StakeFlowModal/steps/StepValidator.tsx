import React, { useCallback, useMemo, useState } from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { Transaction } from "@ledgerhq/live-common/families/stacks/types";
import {
  isPoolAddress,
  isValidNumCycles,
  MAX_NUM_CYCLES,
  MIN_NUM_CYCLES,
  parseNumCycles,
} from "@ledgerhq/coin-stacks/common-logic/staking";
import {
  StacksInvalidNumCycles,
  StacksInvalidPoolAddress,
} from "@ledgerhq/live-common/families/stacks/errors";
import { TrackPage } from "@shared/analytics-react";
import Box from "~/renderer/components/Box";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Text from "~/renderer/components/Text";
import Input from "~/renderer/components/Input";
import Button from "~/renderer/components/Button";
import { StepProps } from "../types";

const isStakeFormValid = (transaction: Transaction | null | undefined): boolean =>
  isPoolAddress(transaction?.valAddress) &&
  isValidNumCycles(transaction?.familySpecificData?.numCycles);

const StepValidator = ({ account, transaction, onChangeTransaction, error }: StepProps) => {
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

  // An empty field is not flagged: the user has not typed anything yet.
  const valAddress = transaction?.valAddress ?? "";
  const poolAddressError = useMemo(
    () => (valAddress && !isPoolAddress(valAddress) ? new StacksInvalidPoolAddress() : undefined),
    [valAddress],
  );
  const numCyclesError = useMemo(
    () =>
      numCyclesInput.trim() && !isValidNumCycles(parseNumCycles(numCyclesInput))
        ? new StacksInvalidNumCycles(undefined, { min: MIN_NUM_CYCLES, max: MAX_NUM_CYCLES })
        : undefined,
    [numCyclesInput],
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
      {/* Until the form is valid the bridge only prepares a placeholder transaction, not the
          stake, so its errors say nothing about what the user entered. */}
      {error && isStakeFormValid(transaction) ? <ErrorBanner error={error} /> : null}
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
          value={valAddress}
          onChange={onChangeValAddress}
          error={poolAddressError}
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
          error={numCyclesError}
          placeholder="1"
          data-testid="stacks-stake-num-cycles-input"
        />
      </Box>
    </Box>
  );
};

export const StepValidatorFooter = ({
  transaction,
  bridgePending,
  error,
  transitionTo,
}: StepProps) => {
  const isFormValid = isStakeFormValid(transaction);
  const canNext = !bridgePending && isFormValid;
  return (
    <Box horizontal alignItems="center" justifyContent="flex-end" flow={2} grow>
      <Button
        id="stacks-stake-validator-continue-button"
        primary
        // No spinner on invalid input, nor on an error: useBridgeTransaction keeps a failed
        // preparation pending while it retries, so the spinner would never stop.
        isLoading={bridgePending && isFormValid && !error}
        disabled={!canNext}
        onClick={() => transitionTo("amount")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
};

export default StepValidator;

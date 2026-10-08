import { useId, type ReactNode } from "react";
import {
  Banner,
  Button,
  SegmentedControl,
  SegmentedControlButton,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
  Table,
  TableBody,
  TableCol,
  TableColGroup,
  TableHeader,
  TableHeaderCell,
  TableHeaderRow,
  TableRoot,
  TableRow,
  Tag,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import { ChevronDown, ChevronUp } from "@ledgerhq/lumen-ui-react/symbols";
import {
  CURVES,
  type CalEnv,
  type Curve,
  type DecodedField,
  type KeySource,
  type ModeHint,
  type SwapFormatChoice,
  type TransactionType,
} from "./logic";
import type {
  CheckResult,
  ExchangePayloadCheckerViewModel,
} from "./useExchangePayloadCheckerViewModel";

const CURVE_ITEMS = CURVES.map(curve => ({ value: curve, label: curve }));

const renderSelectItem = (item: { value: string; label: string }) => (
  <SelectItem key={item.value} value={item.value}>
    <SelectItemText>{item.label}</SelectItemText>
  </SelectItem>
);

// Plain <td> instead of Lumen's TableCell, which always truncates: long values must wrap.
const CELL = "px-12 py-8 align-top body-3 text-base whitespace-normal";
const BREAK_ANYWHERE = `${CELL} font-mono break-all`;
const BREAK_WORDS = `${CELL} break-words`;
const ROW = "border-b border-muted-subtle last:border-b-0";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-12">
    <h2 className="heading-5 text-base">{title}</h2>
    {children}
  </section>
);

const TransactionInputs = ({
  transactionType,
  swapFormatChoice,
  transactionHelper,
  swapFormatWarning,
  onTransactionTypeChange,
  onSwapFormatChoiceChange,
}: ExchangePayloadCheckerViewModel) => (
  <Section title="Transaction">
    <div className="flex flex-wrap gap-24">
      <div className="flex flex-col gap-8">
        <span className="body-3 text-muted">Transaction type</span>
        <SegmentedControl
          selectedValue={transactionType}
          onSelectedChange={value => onTransactionTypeChange(value as TransactionType)}
          tabLayout="fit"
          aria-label="Transaction type"
        >
          <SegmentedControlButton value="swap">Swap</SegmentedControlButton>
          <SegmentedControlButton value="sell">Sell</SegmentedControlButton>
        </SegmentedControl>
      </div>
      {transactionType === "swap" ? (
        <div className="flex flex-col gap-8">
          <span className="body-3 text-muted">Payload format</span>
          <SegmentedControl
            selectedValue={swapFormatChoice}
            onSelectedChange={value => onSwapFormatChoiceChange(value as SwapFormatChoice)}
            tabLayout="fit"
            aria-label="Swap payload format"
          >
            <SegmentedControlButton value="auto">Auto</SegmentedControlButton>
            <SegmentedControlButton value="ng">NG</SegmentedControlButton>
            <SegmentedControlButton value="legacy">Legacy</SegmentedControlButton>
          </SegmentedControl>
        </div>
      ) : null}
    </div>
    {transactionHelper ? <p className="body-3 text-muted">{transactionHelper}</p> : null}
    {swapFormatWarning ? (
      <Banner
        appearance="warning"
        title="Format does not match the provider"
        description={swapFormatWarning}
      />
    ) : null}
  </Section>
);

const PartnerKeyInputs = ({
  keySource,
  calEnv,
  calEnvSelectable,
  calEnvHelper,
  providerListNote,
  providerOptions,
  providersReady,
  providerHelper,
  providerId,
  customCurve,
  customKeyHex,
  customKeyError,
  sellProviderNotice,
  onKeySourceChange,
  onCalEnvChange,
  onProviderChange,
  onRetryProviders,
  onCustomCurveChange,
  onCustomKeyHexChange,
}: ExchangePayloadCheckerViewModel) => {
  const providerHelperId = useId();

  return (
    <Section title="Partner public key">
      <SegmentedControl
        selectedValue={keySource}
        onSelectedChange={value => onKeySourceChange(value as KeySource)}
        tabLayout="fit"
        className="self-start"
        aria-label="Partner public key source"
      >
        <SegmentedControlButton value="provider">Ledger provider</SegmentedControlButton>
        <SegmentedControlButton value="custom">Custom key</SegmentedControlButton>
      </SegmentedControl>

      {keySource === "provider" ? (
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-8">
            {calEnvSelectable ? (
              <>
                <span className="body-3 text-muted">CAL environment</span>
                <SegmentedControl
                  selectedValue={calEnv}
                  onSelectedChange={value => onCalEnvChange(value as CalEnv)}
                  tabLayout="fit"
                  className="self-start"
                  aria-label="CAL environment"
                >
                  <SegmentedControlButton value="prod">Production</SegmentedControlButton>
                  <SegmentedControlButton value="test">Test</SegmentedControlButton>
                </SegmentedControl>
              </>
            ) : null}
            <p className="body-3 text-muted">{calEnvHelper}</p>
            {providerListNote ? <p className="body-3 text-muted">{providerListNote}</p> : null}
          </div>
          <Select
            items={providerOptions}
            value={providerId}
            onValueChange={onProviderChange}
            disabled={!providersReady}
          >
            <SelectTrigger
              label="Provider"
              aria-describedby={providerHelper ? providerHelperId : undefined}
            />
            <SelectContent>
              <SelectList renderItem={renderSelectItem} />
            </SelectContent>
          </Select>
          {providerHelper ? (
            <div className="flex flex-wrap items-center gap-12">
              <p
                id={providerHelperId}
                role={providerHelper.failed ? "alert" : undefined}
                className={providerHelper.failed ? "body-3 text-error" : "body-3 text-muted"}
              >
                {providerHelper.text}
              </p>
              {providerHelper.failed ? (
                <Button appearance="gray" size="sm" onClick={onRetryProviders}>
                  Retry
                </Button>
              ) : null}
            </div>
          ) : null}
          {sellProviderNotice ? (
            <Banner
              appearance="warning"
              title="Legacy Sell is not supported"
              description={sellProviderNotice}
            />
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          <Select
            items={CURVE_ITEMS}
            value={customCurve}
            onValueChange={value => {
              if (value) onCustomCurveChange(value as Curve);
            }}
          >
            <SelectTrigger label="Curve" />
            <SelectContent>
              <SelectList renderItem={renderSelectItem} />
            </SelectContent>
          </Select>
          <TextInput
            label="Public key (hex, uncompressed or compressed)"
            value={customKeyHex}
            onChange={event => onCustomKeyHexChange(event.target.value)}
            onClear={() => onCustomKeyHexChange("")}
            status={customKeyError ? "error" : undefined}
            helperText={customKeyError ?? undefined}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      )}
    </Section>
  );
};

const ExpectedValuesInputs = ({
  expectedOpen,
  expectedToggleLabel,
  expectedInputs,
  expectedValues,
  expectedErrors,
  onToggleExpected,
  onExpectedValueChange,
}: ExchangePayloadCheckerViewModel) => {
  const panelId = useId();

  return (
    <section className="flex flex-col gap-12">
      <Button
        appearance="gray"
        size="sm"
        icon={expectedOpen ? ChevronUp : ChevronDown}
        onClick={onToggleExpected}
        aria-expanded={expectedOpen}
        aria-controls={panelId}
        className="self-start"
      >
        {expectedToggleLabel}
      </Button>
      {expectedOpen ? (
        <div id={panelId} className="grid grid-cols-1 gap-12 sm:grid-cols-2">
          {expectedInputs.map(({ key, label }) => (
            <TextInput
              key={key}
              label={label}
              value={expectedValues[key] ?? ""}
              onChange={event => onExpectedValueChange(key, event.target.value)}
              onClear={() => onExpectedValueChange(key, "")}
              status={expectedErrors[key] ? "error" : undefined}
              helperText={expectedErrors[key]}
              spellCheck={false}
              autoComplete="off"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
};

const ModeHintBanner = ({
  hint: { message, actionLabel, switchTo },
  onApply,
}: {
  hint: ModeHint;
  onApply: ExchangePayloadCheckerViewModel["onApplyModeHint"];
}) => (
  <Banner
    appearance="info"
    title="Check the transaction type and format"
    description={message}
    primaryAction={
      <Button appearance="gray" size="sm" onClick={() => onApply(switchTo)}>
        {actionLabel}
      </Button>
    }
  />
);

const IssuesTable = ({ issues }: { issues: CheckResult["issues"] }) => (
  <TableRoot>
    <Table>
      <TableColGroup>
        <TableCol className="w-112" />
        <TableCol className="w-224" />
        <TableCol className="w-176" />
        <TableCol />
      </TableColGroup>
      <TableHeader>
        <TableHeaderRow>
          <TableHeaderCell>Severity</TableHeaderCell>
          <TableHeaderCell>Code</TableHeaderCell>
          <TableHeaderCell>Field</TableHeaderCell>
          <TableHeaderCell>Message</TableHeaderCell>
        </TableHeaderRow>
      </TableHeader>
      <TableBody>
        {issues.map((issue, index) => (
          <TableRow key={`${issue.code}-${issue.field ?? ""}-${index}`} className={ROW}>
            <td className={CELL}>
              <Tag
                size="sm"
                appearance={issue.severity === "error" ? "error" : "warning"}
                label={issue.severity}
              />
            </td>
            <td className={BREAK_ANYWHERE}>{issue.code}</td>
            <td className={BREAK_ANYWHERE}>{issue.field ?? "-"}</td>
            <td className={BREAK_WORDS}>{issue.message}</td>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableRoot>
);

const DecodedTable = ({ fields }: { fields: DecodedField[] }) => (
  <TableRoot>
    <Table>
      <TableColGroup>
        <TableCol className="w-224" />
        <TableCol />
      </TableColGroup>
      <TableHeader>
        <TableHeaderRow>
          <TableHeaderCell>Field</TableHeaderCell>
          <TableHeaderCell>Value</TableHeaderCell>
        </TableHeaderRow>
      </TableHeader>
      <TableBody>
        {fields.map(({ field, value }) => (
          <TableRow key={field} className={ROW}>
            <td className={BREAK_ANYWHERE}>{field}</td>
            <td className={BREAK_ANYWHERE}>{value}</td>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableRoot>
);

export const ExchangePayloadCheckerView = (viewModel: ExchangePayloadCheckerViewModel) => {
  const {
    payload,
    signature,
    labels,
    result,
    pendingReason,
    onPayloadChange,
    onSignatureChange,
    onApplyModeHint,
  } = viewModel;

  return (
    <div className="flex flex-col gap-32">
      <Banner
        appearance="info"
        title="Runs entirely in your browser"
        description="The payload, signature and public key are never sent anywhere. Only the Ledger provider list is fetched."
      />

      <TransactionInputs {...viewModel} />

      <Section title="Payload and signature">
        <TextInput
          label={labels.payload}
          multiline
          minLines={4}
          maxLines={12}
          value={payload}
          onChange={event => onPayloadChange(event.target.value)}
          onClear={() => onPayloadChange("")}
          spellCheck={false}
          autoComplete="off"
        />
        <TextInput
          label={labels.signature}
          value={signature}
          onChange={event => onSignatureChange(event.target.value)}
          onClear={() => onSignatureChange("")}
          spellCheck={false}
          autoComplete="off"
        />
      </Section>

      <PartnerKeyInputs {...viewModel} />
      <ExpectedValuesInputs {...viewModel} />

      <Section title="Result">
        <div aria-live="polite" className="flex flex-col gap-12">
          {result ? (
            <>
              {result.modeHint ? (
                <ModeHintBanner hint={result.modeHint} onApply={onApplyModeHint} />
              ) : null}
              <Banner {...result.banner} />
              {result.issues.length > 0 ? <IssuesTable issues={result.issues} /> : null}
              {result.decodedFields.length > 0 ? (
                <>
                  <h3 className="body-1-semi-bold text-base">Decoded fields</h3>
                  <DecodedTable fields={result.decodedFields} />
                </>
              ) : null}
            </>
          ) : (
            <p className="body-2 text-muted">{pendingReason}</p>
          )}
        </div>
      </Section>
    </div>
  );
};

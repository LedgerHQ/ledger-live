import {
  Banner,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectItemContent,
  SelectItemDescription,
  SelectItemText,
  SelectList,
  SelectSearch,
  SelectTrigger,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import { ActionButton, type RunProps } from "../../../components/ActionButton";
import { ALL_ACCOUNTS } from "../../../utils/registration";
import { Section } from "../../../components/Section";
import { StepBadge } from "../../../components/StepBadge";
import type { AccountPortfolioViewModel } from "../../../AccountPortfolio/types";

type Props = RunProps &
  Pick<
    AccountPortfolioViewModel,
    | "progress"
    | "nextStep"
    | "hasAccounts"
    | "accountItems"
    | "chosen"
    | "choose"
    | "payload"
    | "payloadValid"
    | "isCustomPayload"
    | "setCustomPayload"
    | "resetPayload"
    | "canRegister"
    | "registerLabel"
  >;

export function RegisterSection(props: Readonly<Props>) {
  return (
    <Section
      title="Register accounts"
      description="Tell the service which of your accounts to track. Bitcoin and EVM accounts only for now."
      badge={
        <StepBadge
          done={props.progress.registered}
          nextLabel={props.nextStep === "registerAccounts" ? "Next" : undefined}
        />
      }
    >
      {props.hasAccounts ? (
        <Select
          items={[...props.accountItems]}
          value={props.chosen}
          onValueChange={value => props.choose(value ?? ALL_ACCOUNTS)}
        >
          <SelectTrigger label="Accounts to register" />
          <SelectContent>
            <SelectSearch placeholder="Search an account" />
            <SelectList
              renderItem={item => (
                <SelectItem key={item.value} value={item.value}>
                  <SelectItemContent>
                    <SelectItemText>{item.label}</SelectItemText>
                    {item.description ? (
                      <SelectItemDescription>{item.description}</SelectItemDescription>
                    ) : null}
                  </SelectItemContent>
                </SelectItem>
              )}
            />
          </SelectContent>
        </Select>
      ) : (
        <Banner
          appearance="warning"
          title="No Bitcoin or EVM account in the wallet"
          description="Only these two families can be registered for now. Add one in Ledger Wallet, or write a payload by hand below."
        />
      )}

      <details>
        <summary className="cursor-pointer body-3 text-muted">
          Advanced: payload sent to the service
        </summary>
        <div className="mt-8 flex flex-col gap-8">
          <TextInput
            multiline
            minLines={4}
            maxLines={10}
            label="Registrations (JSON array)"
            value={props.payload}
            onChange={e => props.setCustomPayload(e.target.value)}
            status={props.payloadValid ? undefined : "error"}
            helperText={props.payloadValid ? undefined : "Not a valid JSON array"}
          />
          {props.isCustomPayload ? (
            <div className="flex">
              <Button size="sm" appearance="no-background" onClick={props.resetPayload}>
                Rebuild from the chosen accounts
              </Button>
            </div>
          ) : null}
        </div>
      </details>

      <div className="flex gap-12">
        <ActionButton
          kind="registerAccounts"
          appearance="base"
          disabled={!props.canRegister}
          label={props.registerLabel}
          {...props}
        />
      </div>
    </Section>
  );
}

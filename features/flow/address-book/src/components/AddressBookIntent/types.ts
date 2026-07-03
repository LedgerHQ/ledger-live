import type {
  AddressBookEvmIntentExtraProps,
  AddressBookEvmIntentJobState,
} from "../../intents/evm";

export type AddressBookIntentComponentProps = {
  jobState: AddressBookEvmIntentJobState | undefined;
  extraProps: AddressBookEvmIntentExtraProps;
  onClose: () => void;
};

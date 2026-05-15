import React from "react";
import { AddressInput } from "@ledgerhq/lumen-ui-react";
import { Refresh } from "@ledgerhq/lumen-ui-react/symbols";
import { randomAddressHex } from "../validation";

type Props = {
  value: string;
  onChange: (next: string) => void;
  /** Whether the field is interactable. Disabled until a network is picked. */
  disabled?: boolean;
  /** Marks the field invalid when the user has typed something that doesn't parse. */
  invalid?: boolean;
  errorMessage?: string;
  placeholder?: string;
};

const AddressInputWithRandom = ({
  value,
  onChange,
  disabled,
  invalid,
  errorMessage,
  placeholder,
}: Props) => {
  const fillRandom = () => onChange(randomAddressHex());

  return (
    <AddressInput
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      aria-invalid={invalid}
      errorMessage={errorMessage}
      placeholder={placeholder}
      hideClearButton
      suffix={
        <button
          type="button"
          aria-label="Generate random address"
          onClick={fillRandom}
          disabled={disabled}
          className="cursor-pointer text-muted hover:text-base disabled:cursor-not-allowed disabled:text-disabled"
        >
          <Refresh size={20} />
        </button>
      }
    />
  );
};

export default AddressInputWithRandom;

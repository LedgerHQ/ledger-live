import styled from "styled-components";
import React, { useCallback, useReducer } from "react";
import SendButton from "./SendButton";

const ApduForm = styled.form`
  display: flex;
`;

const ApduInput = styled.input`
  width: 100%;
  padding: 5px 10px;
  height: 40px;
  font-size: 14px;
  border-top: 2px solid rgba(0, 0, 0, 0.5);
  border: none;
  outline: none;
  color: ${props => props.theme.text};
  background: ${props => props.theme.darkBackground};
`;

type APDUState = {
  index?: number;
  commands: string[];
  value: string;
};
type APDUAction =
  | { type: "ADD_TO_HISTORY"; payload: string }
  | { type: "HISTORY_UP" }
  | { type: "HISTORY_DOWN" }
  | { type: "CLEAR_HISTORY" }
  | { type: "SET_VALUE"; payload: string }
  | { type: "CLEAR_VALUE" };

const apduHistoryReducer = (state: APDUState, action: APDUAction): APDUState => {
  const { index, commands } = state;

  let newIndex: number | undefined = index;

  switch (action.type) {
    case "ADD_TO_HISTORY":
      if (action.payload === commands[commands.length - 1]) {
        return state;
      }
      return {
        ...state,
        commands: [...commands, action.payload],
      };
    case "HISTORY_UP":
      if (index && index > 0) {
        newIndex = index - 1;
      }
      if (index === undefined && commands.length > 0) {
        newIndex = commands.length - 1;
      }

      return {
        ...state,
        index: newIndex,
        value: newIndex !== undefined ? commands[newIndex] : state.value,
      };
    case "HISTORY_DOWN":
      if (index === commands.length - 1) {
        newIndex = undefined;
      }

      if (index !== undefined && index < commands.length - 1) {
        newIndex = index + 1;
      }

      return {
        ...state,
        index: newIndex,
        value: newIndex !== undefined ? commands[newIndex] : "",
      };
    case "CLEAR_HISTORY":
      return {
        index: undefined,
        commands: [],
        value: "",
      };
    case "SET_VALUE":
      return {
        ...state,
        value: action.payload,
      };
    case "CLEAR_VALUE":
      return {
        ...state,
        index: undefined,
        value: "",
      };
    default:
      return state;
  }
};

function ApduCommandSender({
  onSend,
  disabled,
}: {
  onSend: (value: string) => Promise<boolean>;
  disabled?: boolean;
}) {
  const [state, dispatch] = useReducer(apduHistoryReducer, {
    commands: [],
    value: "",
  });

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (state.value === "") {
        return;
      }

      const result = await onSend(state.value);
      if (result) {
        dispatch({ type: "ADD_TO_HISTORY", payload: state.value });
        dispatch({ type: "CLEAR_VALUE" });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.value],
  );

  const handleKeypress = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        dispatch({ type: "HISTORY_UP" });
        e.preventDefault();
        break;
      case "ArrowDown":
        dispatch({ type: "HISTORY_DOWN" });
        e.preventDefault();
        break;
    }
  };

  return (
    <ApduForm onSubmit={onSubmit}>
      <ApduInput
        onKeyDown={handleKeypress}
        disabled={disabled}
        type="text"
        value={state.value}
        onChange={e => dispatch({ type: "SET_VALUE", payload: e.target.value })}
        placeholder="send an arbitrary apdu here (hexadecimal)"
      />
      <SendButton title="Send" disabled={disabled} />
    </ApduForm>
  );
}

export default ApduCommandSender;

import React, { useEffect, useRef, useImperativeHandle } from "react";
import { TextInput, TextInputProps } from "react-native";

function FocusedTextInput(
  props: React.PropsWithRef<TextInputProps>,
  ref: React.Ref<TextInput | null>,
) {
  const inputRef = useRef<TextInput | null>(null);
  // allows to still forward ref to parent to call
  useImperativeHandle(ref, () => inputRef.current);
  // FIXME: do we really want this useEffect to trigger every type the props object change????
  useEffect(() => {
    props.autoFocus && inputRef.current?.focus();
  }, [props, ref]);
  return <TextInput ref={inputRef} {...props} />;
}

export default React.forwardRef(FocusedTextInput);

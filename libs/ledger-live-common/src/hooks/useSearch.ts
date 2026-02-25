import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import Fuse from "fuse.js";
import { useDebounce } from "../hooks/useDebounce";

export function useSearch<Item, T extends TextInput | undefined = undefined>({
  list,
  options,
  defaultInput = "",
  filter,
}: {
  list: Item[];
  defaultInput?: string;
  options: Fuse.IFuseOptions<Item>;
  filter?: (item: Item, input: string) => void;
}): SearchRaw<Item, T> {
  const inputRef = useRef<T>(null);
  const [isActive, setIsActive] = useState(false);

  const [input, setInput] = useState(defaultInput);
  const debouncedInput = useDebounce(input, 500);

  const [isSearching, setIsSearching] = useState(false);

  const [result, setResult] = useState(list);
  const fuse = useRef(new Fuse(list, options));

  const onChange = useCallback((value: string) => {
    if (value.length !== 0) {
      setIsSearching(true);
    }

    setInput(value);
  }, []);

  useEffect(() => {
    if (debouncedInput && fuse.current) {
      setIsSearching(true);
      setResult(fuse.current.search(debouncedInput).map(res => res.item));
    } else {
      setResult([]);
    }

    setIsSearching(false);
  }, [debouncedInput]);

  const onFocus = useCallback(() => {
    setIsActive(true);
  }, []);

  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    }
  }, [isActive]);

  const onCancel = useCallback(() => {
    setInput("");
    setIsActive(false);

    inputRef.current?.blur();
  }, []);

  const resultOut = useMemo(() => {
    const res = input === "" ? list : result;

    return filter ? res.filter(item => filter(item, input)) : res;
  }, [list, result, input, filter]);

  return {
    inputRef,
    input,
    result: resultOut,
    isActive,
    isSearching,
    onChange,
    onFocus,
    onCancel,
  };
}

export interface SearchRaw<Item, T extends TextInput | undefined = undefined> {
  inputRef: React.RefObject<T>;
  input: string;
  result: Item[];
  isActive: boolean;
  isSearching: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onCancel: () => void;
}

export interface TextInput {
  focus: () => void;
  blur: () => void;
}

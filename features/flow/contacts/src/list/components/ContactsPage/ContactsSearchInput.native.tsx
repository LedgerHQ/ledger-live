import React, { useCallback } from "react";
import { SearchInput } from "@ledgerhq/lumen-ui-rnative";

type ContactsSearchInputProps = Readonly<{
  placeholder: string;
  value: string;
  onSearchQueryChange: (query: string) => void;
}>;

export function ContactsSearchInput({
  placeholder,
  value,
  onSearchQueryChange,
}: ContactsSearchInputProps): React.JSX.Element {
  const handleClear = useCallback(() => {
    onSearchQueryChange("");
  }, [onSearchQueryChange]);

  return (
    <SearchInput
      testID="contacts-search-input"
      value={value}
      onChangeText={onSearchQueryChange}
      onClear={handleClear}
      hideClearButton={false}
      placeholder={placeholder}
      accessibilityLabel={placeholder}
      autoCorrect={false}
      autoCapitalize="none"
    />
  );
}

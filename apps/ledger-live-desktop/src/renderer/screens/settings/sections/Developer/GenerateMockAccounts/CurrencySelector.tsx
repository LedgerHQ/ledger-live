import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { getSupportedCurrencies } from "./utils";
import CheckBox from "~/renderer/components/CheckBox";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import Input from "~/renderer/components/Input";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";
import AngleDown from "~/renderer/icons/AngleDown";
import type { Currency } from "@ledgerhq/types-cryptoassets";

const SelectContainer = styled(Box)`
  border: 1px solid ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: ${p => p.theme.colors.palette.primary.main};
  }
`;

const DropdownContainer = styled(Box)`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: ${p => p.theme.colors.palette.background.paper};
  border: 1px solid ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
`;

const CurrencyItem = styled(Box)`
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${p => p.theme.colors.palette.background.default};
  }
`;

const SearchContainer = styled(Box)`
  padding: 12px;
  border-bottom: 1px solid ${p => p.theme.colors.palette.divider};
`;

type Props = {
  selectedCurrencies: Record<string, boolean>;
  onCurrencyToggle: (currencyId: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

// Composant pour afficher le texte de sélection
const SelectionDisplay = ({
  selectedCount,
  selectedCurrenciesList,
  placeholder,
}: {
  selectedCount: number;
  selectedCurrenciesList: Currency[];
  placeholder: string;
}) => {
  const getDisplayText = () => {
    if (selectedCount === 0) return placeholder;
    if (selectedCount === 1) return selectedCurrenciesList[0]?.name || placeholder;
    if (selectedCount <= 3) {
      return selectedCurrenciesList.map(c => c.name).join(", ");
    }
    return `${selectedCount} currencies selected`;
  };

  return (
    <Box flex={1}>
      <Text ff="Inter|Medium" fontSize={3} color="palette.text.shade100">
        {getDisplayText()}
      </Text>
      {selectedCount > 0 && (
        <Text ff="Inter|Regular" fontSize={2} color="palette.text.shade60" mt={1}>
          {selectedCount} currency{selectedCount > 1 ? "ies" : "y"} selected
        </Text>
      )}
    </Box>
  );
};

// Composant pour un élément de devise
const CurrencyItemComponent = ({
  currency,
  isSelected,
  onToggle,
}: {
  currency: Currency;
  isSelected: boolean;
  onToggle: () => void;
}) => (
  <CurrencyItem horizontal alignItems="center" py={2} px={3} onClick={onToggle}>
    <CheckBox isChecked={isSelected} onChange={onToggle} />
    <Box ml={2} horizontal alignItems="center" flex={1}>
      <CryptoCurrencyIcon currency={currency} size={20} />
      <Box ml={2} flex={1}>
        <Text ff="Inter|SemiBold" fontSize={3} color="palette.text.shade100">
          {currency.name}
        </Text>
        <Text ff="Inter|Regular" fontSize={2} color="palette.text.shade60">
          {currency.ticker}
        </Text>
      </Box>
    </Box>
  </CurrencyItem>
);

// Hook personnalisé pour la gestion du clic à l'extérieur
const useClickOutside = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  isActive: boolean,
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    if (isActive) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback, isActive]);
};

export default function CurrencySelector({
  selectedCurrencies,
  onCurrencyToggle,
  placeholder = "Choose currencies...",
  disabled = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const allCurrencies = getSupportedCurrencies();
  const sortedCurrencies = useCurrenciesByMarketcap(allCurrencies);

  const filteredCurrencies = useMemo(() => {
    if (!searchValue) return sortedCurrencies;

    const searchLower = searchValue.toLowerCase();
    return sortedCurrencies.filter(
      currency =>
        currency.name.toLowerCase().includes(searchLower) ||
        currency.ticker.toLowerCase().includes(searchLower),
    );
  }, [sortedCurrencies, searchValue]);

  const selectedCount = Object.values(selectedCurrencies).filter(Boolean).length;
  const selectedCurrenciesList = sortedCurrencies.filter(c => selectedCurrencies[c.id]);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const handleToggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  }, [isOpen, disabled]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleCurrencyToggle = useCallback(
    (currencyId: string) => {
      onCurrencyToggle(currencyId);
    },
    [onCurrencyToggle],
  );

  return (
    <Box relative ref={containerRef}>
      <SelectContainer
        horizontal
        alignItems="center"
        justifyContent="space-between"
        py={2}
        px={3}
        onClick={handleToggleDropdown}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <SelectionDisplay
          selectedCount={selectedCount}
          selectedCurrenciesList={selectedCurrenciesList}
          placeholder={placeholder}
        />
        <AngleDown size={16} color={isOpen ? "palette.text.shade100" : "palette.text.shade60"} />
      </SelectContainer>

      {isOpen && (
        <DropdownContainer>
          <SearchContainer>
            <Input
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Search currencies..."
              maxLength={50}
              autoFocus
            />
          </SearchContainer>

          {filteredCurrencies.length === 0 ? (
            <Box p={3} horizontal alignItems="center" justifyContent="center">
              <Text ff="Inter|Regular" fontSize={3} color="palette.text.shade60">
                {searchValue ? "No currencies found" : "No currencies available"}
              </Text>
            </Box>
          ) : (
            filteredCurrencies.map(currency => (
              <CurrencyItemComponent
                key={currency.id}
                currency={currency}
                isSelected={selectedCurrencies[currency.id] || false}
                onToggle={() => handleCurrencyToggle(currency.id)}
              />
            ))
          )}
        </DropdownContainer>
      )}
    </Box>
  );
}

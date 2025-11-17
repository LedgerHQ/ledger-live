import { useState } from "react";
import { useTokensData } from "@ledgerhq/cryptoassets/cal-client/hooks/useTokensData";
import { TOKEN_OUTPUT_FIELDS } from "@ledgerhq/cryptoassets/cal-client/state-manager/fields";
import { FAMILY_OPTIONS } from "../constants";
import { FamilyOption } from "../types";

export const useTokenList = (initialFamily: string = "ethereum") => {
  const initialOption =
    FAMILY_OPTIONS.find(opt => opt.value === initialFamily) || FAMILY_OPTIONS[0];
  const [selectedFamilyOption, setSelectedFamilyOption] = useState<FamilyOption | null>(
    initialOption,
  );
  const [isStaging, setIsStaging] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<number>(1000);
  const [selectedOutputFields, setSelectedOutputFields] = useState<string[]>([
    ...TOKEN_OUTPUT_FIELDS,
  ]);
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(true);
  const [expandedTokenIds, setExpandedTokenIds] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState<string>("");
  const [ref, setRef] = useState<string>("");

  const selectedFamily = selectedFamilyOption?.value || "ethereum";
  const limitNumber = limit && !isNaN(Number(limit)) ? Number(limit) : undefined;

  const { data, isLoading, error, loadNext, refetch } = useTokensData({
    networkFamily: selectedFamily,
    isStaging,
    pageSize,
    output: selectedOutputFields.length > 0 ? selectedOutputFields : undefined,
    limit: limitNumber,
    ref: ref || undefined,
  });

  const tokens = data?.tokens || [];
  const hasMore = Boolean(loadNext);

  const isSingleFamilyOption = (
    value: FamilyOption | readonly FamilyOption[] | null,
  ): value is FamilyOption => {
    return value !== null && !Array.isArray(value);
  };

  const isSingleOption = (
    value: { value: string; label: string } | readonly { value: string; label: string }[] | null,
  ): value is { value: string; label: string } => {
    return value !== null && !Array.isArray(value);
  };

  const handleFamilyChange = (newValue: FamilyOption | readonly FamilyOption[] | null) => {
    if (isSingleFamilyOption(newValue)) {
      setSelectedFamilyOption(newValue);
    }
  };

  const handlePageSizeChange = (
    newValue: { value: string; label: string } | readonly { value: string; label: string }[] | null,
  ) => {
    if (isSingleOption(newValue)) {
      setPageSize(Number(newValue.value));
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleToggleStaging = () => {
    setIsStaging(!isStaging);
  };

  const handleLoadMore = () => {
    if (loadNext) {
      loadNext();
    }
  };

  const toggleOptionsPanel = () => {
    setIsOptionsOpen(!isOptionsOpen);
  };

  const toggleTokenExpanded = (tokenId: string) => {
    const newExpanded = new Set(expandedTokenIds);
    if (newExpanded.has(tokenId)) {
      newExpanded.delete(tokenId);
    } else {
      newExpanded.add(tokenId);
    }
    setExpandedTokenIds(newExpanded);
  };

  const toggleOutputField = (field: string) => {
    if (selectedOutputFields.includes(field)) {
      setSelectedOutputFields(selectedOutputFields.filter(f => f !== field));
    } else {
      setSelectedOutputFields([...selectedOutputFields, field]);
    }
  };

  const selectAllOutputFields = () => {
    setSelectedOutputFields([...TOKEN_OUTPUT_FIELDS]);
  };

  const deselectAllOutputFields = () => {
    setSelectedOutputFields([]);
  };

  const handleReset = () => {
    setLimit("");
    setRef("");
    setSelectedOutputFields([...TOKEN_OUTPUT_FIELDS]);
    setPageSize(1000);
    setIsStaging(true);
    setSelectedFamilyOption(FAMILY_OPTIONS[0]);
  };

  const collapseAllTokens = () => {
    setExpandedTokenIds(new Set());
  };

  return {
    selectedFamilyOption,
    isStaging,
    pageSize,
    selectedOutputFields,
    isOptionsOpen,
    expandedTokenIds,
    limit,
    ref,
    selectedFamily,

    tokens,
    isLoading,
    error,
    hasMore,

    setLimit,
    setRef,

    handleFamilyChange,
    handlePageSizeChange,
    handleRefresh,
    handleToggleStaging,
    handleLoadMore,
    toggleOptionsPanel,
    toggleTokenExpanded,
    toggleOutputField,
    selectAllOutputFields,
    deselectAllOutputFields,
    handleReset,
    collapseAllTokens,
  };
};

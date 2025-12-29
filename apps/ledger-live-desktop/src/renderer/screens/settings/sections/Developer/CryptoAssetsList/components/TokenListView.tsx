import React from "react";
import {
  Flex,
  Text,
  SelectInput,
  InfiniteLoader,
  Checkbox,
  Icons,
  Input,
} from "@ledgerhq/react-ui/index";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { TOKEN_OUTPUT_FIELDS } from "@ledgerhq/cryptoassets/cal-client/state-manager/fields";
import { FAMILY_OPTIONS, PAGE_SIZE_OPTIONS, OUTPUT_FIELD_OPTIONS } from "../constants";
import {
  DrawerContainer,
  HeaderSection,
  ConfigSection,
  TokenListSection,
  CollapsibleHeader,
  CollapsibleContent,
  StyledCheckbox,
  MultiSelectContainer,
  TokenItem,
  TokenHeader,
  TokenNameContainer,
  TokenName,
  TokenTicker,
  TokenTag,
  LoadMoreButton,
  ParameterGrid,
  ParameterGroup,
  SectionDivider,
} from "../styles";
import { TokenDetailsContent } from "./TokenDetailsContent";
import { useTokenList } from "../hooks/useTokenList";

interface TokenListViewProps {
  initialFamily?: string;
}

export const TokenListView: React.FC<TokenListViewProps> = ({ initialFamily = "ethereum" }) => {
  const { t } = useTranslation();

  const {
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
  } = useTokenList(initialFamily);

  return (
    <DrawerContainer>
      {/* Header Section */}
      <HeaderSection>
        <Flex alignItems="center" justifyContent="space-between">
          <Text variant="h3" fontWeight="semiBold">
            {t("settings.developer.cryptoAssetsList.drawer.title")}
          </Text>
          <Flex columnGap={2}>
            <Button size="sm" appearance="transparent" onClick={handleReset}>
              {t("settings.developer.cryptoAssetsList.drawer.reset")}
            </Button>
          </Flex>
        </Flex>
      </HeaderSection>

      {/* Config Section */}
      <ConfigSection>
        <CollapsibleHeader collapsed={!isOptionsOpen} onClick={toggleOptionsPanel}>
          <Flex alignItems="center" columnGap={2}>
            <Text variant="h5" fontWeight="semiBold">
              {t("settings.developer.cryptoAssetsList.drawer.options")}
            </Text>
            <Text variant="small" color="neutral.c70">
              {isOptionsOpen
                ? t("settings.developer.cryptoAssetsList.drawer.hide")
                : t("settings.developer.cryptoAssetsList.drawer.show")}
            </Text>
          </Flex>
          {isOptionsOpen ? <Icons.ChevronUp size="M" /> : <Icons.ChevronDown size="M" />}
        </CollapsibleHeader>

        <CollapsibleContent isOpen={isOptionsOpen}>
          {/* Search & Filters Section */}
          <ParameterGroup>
            <Text variant="small" fontWeight="semiBold" color="primary.c80" mb={2}>
              {t("settings.developer.cryptoAssetsList.drawer.searchAndFilters").toUpperCase()}
            </Text>
            <Flex flexDirection="column" rowGap={3}>
              <ParameterGrid>
                <Flex flexDirection="column" rowGap={1}>
                  <Text variant="small" fontWeight="medium" color="neutral.c100">
                    {t("settings.developer.cryptoAssetsList.drawer.blockchainFamily")}
                  </Text>
                  <SelectInput
                    value={selectedFamilyOption}
                    options={FAMILY_OPTIONS}
                    onChange={handleFamilyChange}
                    placeholder={t("settings.developer.cryptoAssetsList.drawer.selectFamily")}
                  />
                </Flex>

                <Flex flexDirection="column" rowGap={1}>
                  <Text variant="small" fontWeight="medium" color="neutral.c100">
                    {t("settings.developer.cryptoAssetsList.drawer.maxResults")}
                  </Text>
                  <Input
                    value={limit}
                    onChange={setLimit}
                    placeholder={t(
                      "settings.developer.cryptoAssetsList.drawer.maxResultsPlaceholder",
                    )}
                    type="number"
                  />
                </Flex>
              </ParameterGrid>
            </Flex>
          </ParameterGroup>

          <SectionDivider />

          {/* Pagination Section */}
          <ParameterGroup>
            <Text variant="small" fontWeight="semiBold" color="primary.c80" mb={2}>
              {t("settings.developer.cryptoAssetsList.drawer.pagination").toUpperCase()}
            </Text>
            <Flex flexDirection="column" rowGap={1}>
              <Text variant="small" fontWeight="medium" color="neutral.c100">
                {t("settings.developer.cryptoAssetsList.drawer.pageSize")}
              </Text>
              <SelectInput
                value={PAGE_SIZE_OPTIONS.find(opt => opt.value === String(pageSize))}
                options={PAGE_SIZE_OPTIONS}
                onChange={handlePageSizeChange}
                placeholder="Select page size"
              />
            </Flex>
          </ParameterGroup>

          <SectionDivider />

          {/* Advanced Section */}
          <ParameterGroup>
            <Text variant="small" fontWeight="semiBold" color="primary.c80" mb={2}>
              {t("settings.developer.cryptoAssetsList.drawer.advanced").toUpperCase()}
            </Text>
            <Flex flexDirection="column" rowGap={3}>
              <StyledCheckbox onClick={handleToggleStaging}>
                <Checkbox
                  isChecked={isStaging}
                  name="staging-toggle"
                  onChange={handleToggleStaging}
                />
                <Flex flexDirection="column" rowGap={0}>
                  <Text variant="small" fontWeight="medium">
                    {t("settings.developer.cryptoAssetsList.drawer.useStaging")}
                  </Text>
                  <Text variant="tiny" color="neutral.c70">
                    {t("settings.developer.cryptoAssetsList.drawer.useStagingDesc")}
                  </Text>
                </Flex>
              </StyledCheckbox>

              <Flex flexDirection="column" rowGap={1}>
                <Text variant="small" fontWeight="medium" color="neutral.c100">
                  {t("settings.developer.cryptoAssetsList.drawer.calReference")}
                </Text>
                <Input
                  value={ref}
                  onChange={setRef}
                  placeholder={t(
                    "settings.developer.cryptoAssetsList.drawer.calReferencePlaceholder",
                  )}
                />
                <Text variant="tiny" color="neutral.c70">
                  {t("settings.developer.cryptoAssetsList.drawer.calReferenceDefault")}
                </Text>
              </Flex>

              <Flex flexDirection="column" rowGap={2}>
                <Flex alignItems="center" justifyContent="space-between">
                  <Text variant="small" fontWeight="medium" color="neutral.c100">
                    {t("settings.developer.cryptoAssetsList.drawer.outputFields")} (
                    {selectedOutputFields.length}/{TOKEN_OUTPUT_FIELDS.length})
                  </Text>
                  <Flex columnGap={2}>
                    <Button size="sm" appearance="transparent" onClick={selectAllOutputFields}>
                      {t("settings.developer.cryptoAssetsList.drawer.selectAll")}
                    </Button>
                    <Button size="sm" appearance="transparent" onClick={deselectAllOutputFields}>
                      {t("settings.developer.cryptoAssetsList.drawer.selectNone")}
                    </Button>
                  </Flex>
                </Flex>
                <MultiSelectContainer>
                  {OUTPUT_FIELD_OPTIONS.map(field => (
                    <StyledCheckbox
                      key={field.value}
                      onClick={() => toggleOutputField(field.value)}
                      style={{ padding: "6px 8px", marginBottom: "0" }}
                    >
                      <Checkbox
                        isChecked={selectedOutputFields.includes(field.value)}
                        name={`output-${field.value}`}
                        onChange={() => toggleOutputField(field.value)}
                      />
                      <Text variant="tiny" fontWeight="medium">
                        {field.label}
                      </Text>
                    </StyledCheckbox>
                  ))}
                </MultiSelectContainer>
              </Flex>
            </Flex>
          </ParameterGroup>
        </CollapsibleContent>

        <Flex columnGap={3} mt={3} justifyContent="flex-end">
          <Button size="sm" appearance="base" onClick={handleRefresh} disabled={isLoading}>
            {isLoading
              ? t("settings.developer.cryptoAssetsList.drawer.loading")
              : t("settings.developer.cryptoAssetsList.drawer.refresh")}
          </Button>
        </Flex>
      </ConfigSection>

      {/* Token List Section */}
      <TokenListSection>
        <Flex flexDirection="column" mb={3}>
          <Flex alignItems="center" justifyContent="space-between" mb={2}>
            <Flex alignItems="baseline" columnGap={2}>
              <Text variant="h5" fontWeight="semiBold" color="neutral.c100">
                {t("settings.developer.cryptoAssetsList.drawer.tokens")}
              </Text>
              {!isLoading && !error && tokens.length > 0 && (
                <Text variant="small" color="neutral.c70">
                  {t("settings.developer.cryptoAssetsList.drawer.resultsCount", {
                    count: tokens.length,
                  })}
                </Text>
              )}
            </Flex>
            {!isLoading && !error && tokens.length > 0 && (
              <Flex alignItems="center" columnGap={2}>
                <Text variant="small" color="neutral.c70">
                  {selectedFamily.charAt(0).toUpperCase() + selectedFamily.slice(1)}
                </Text>
                <Button
                  appearance="transparent"
                  size="sm"
                  onClick={collapseAllTokens}
                  disabled={expandedTokenIds.size === 0}
                >
                  {t("settings.developer.cryptoAssetsList.drawer.collapseAll")}
                </Button>
              </Flex>
            )}
          </Flex>

          {isLoading && tokens.length === 0 && (
            <Flex justifyContent="center" py={6}>
              <InfiniteLoader size={40} />
            </Flex>
          )}

          {error && (
            <Flex
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={6}
              rowGap={2}
            >
              <Text variant="body" color="error.c50" textAlign="center">
                {t("settings.developer.cryptoAssetsList.drawer.error")}
              </Text>
              <Text variant="small" color="neutral.c70" textAlign="center">
                {String(error)}
              </Text>
            </Flex>
          )}
        </Flex>

        <Flex flexDirection="column">
          {!isLoading && !error && tokens.length === 0 && (
            <Flex
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={8}
              rowGap={2}
            >
              <Icons.InformationFill size="L" color="neutral.c70" />
              <Text variant="body" color="neutral.c70" textAlign="center">
                {t("settings.developer.cryptoAssetsList.drawer.noTokensFound")}
              </Text>
            </Flex>
          )}

          {tokens.map(token => {
            const isExpanded = expandedTokenIds.has(token.id);
            return (
              <TokenItem
                key={token.id}
                isExpanded={isExpanded}
                onClick={() => toggleTokenExpanded(token.id)}
              >
                <TokenHeader>
                  <TokenNameContainer>
                    <TokenName title={token.name}>
                      <Text variant="large" fontWeight="semiBold">
                        {token.name}
                      </Text>
                    </TokenName>
                    <TokenTicker>
                      <Text variant="body" color="neutral.c70" fontWeight="medium">
                        ({token.ticker})
                      </Text>
                    </TokenTicker>
                    {token.delisted && (
                      <TokenTag>
                        <Text variant="tiny" color="error.c100" fontWeight="semiBold">
                          {t("settings.developer.cryptoAssetsList.drawer.delisted")}
                        </Text>
                      </TokenTag>
                    )}
                  </TokenNameContainer>
                  <Flex alignItems="center" columnGap={2} flexShrink={0}>
                    <Button
                      size="sm"
                      appearance="transparent"
                      onClick={e => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(token.id);
                      }}
                    >
                      {t("settings.developer.cryptoAssetsList.drawer.copy")}
                    </Button>
                    {isExpanded ? <Icons.ChevronUp size="M" /> : <Icons.ChevronDown size="M" />}
                  </Flex>
                </TokenHeader>

                {isExpanded && <TokenDetailsContent token={token} t={t} />}
              </TokenItem>
            );
          })}

          {hasMore && (
            <Flex justifyContent="center" mt={3}>
              <LoadMoreButton variant="main" size="medium" onClick={handleLoadMore}>
                {t("settings.developer.cryptoAssetsList.drawer.loadMore")}
              </LoadMoreButton>
            </Flex>
          )}

          {isLoading && tokens.length > 0 && (
            <Flex justifyContent="center" py={4}>
              <InfiniteLoader size={28} />
            </Flex>
          )}
        </Flex>
      </TokenListSection>
    </DrawerContainer>
  );
};

import React, { useEffect, useState } from "react";
import Button from "~/renderer/components/Button";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import { Box, Flex, Text } from "@ledgerhq/react-ui";
import { CryptoAsset } from "~/renderer/components/AssetsDataExample";

const MockFetchDemoButton: React.FC = () => {
  const [showMockFetchDemo, setShowMockFetchDemo] = useState(false);

  return (
    <>
      <Row title="Mock Fetch Demo" desc="Demo fetch interceptor">
        <Button primary onClick={() => setShowMockFetchDemo(val => !val)}>
          {showMockFetchDemo ? "Hide" : "Show"}
        </Button>
      </Row>
      {showMockFetchDemo && <AssetsDataExample />}
    </>
  );
};

export default MockFetchDemoButton;

const AssetsDataExample: React.FC = () => {
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCrypto = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://legdger-test-api.com/assets/crypto");
      const data = await response.json();
      setCryptoAssets(data.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrypto();
  }, []);

  return (
    <Box p={6}>
      <Flex>
        {error && <Box>Error: {error}</Box>}
        {loading && (
          <Box>
            <Text color="palette.text.shade80">
              Loading https://legdger-test-api.com/assets/crypto...
            </Text>
          </Box>
        )}
        <Box>
          {cryptoAssets.map(asset => (
            <Flex key={asset.id} style={{ gap: 15 }}>
              <Text>
                {asset.name} ({asset.symbol})
              </Text>
            </Flex>
          ))}
        </Box>
      </Flex>
    </Box>
  );
};

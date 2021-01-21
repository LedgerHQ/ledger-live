// @flow
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Select from "react-select";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { listCryptoCurrencies } from "@ledgerhq/live-common/lib/currencies";
import { setEnv } from "@ledgerhq/live-common/lib/env";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/react";
import manager from "@ledgerhq/live-common/lib/manager";

const coins = listCryptoCurrencies();

const Container = styled.div`
  width: 600px;
  margin: 20px auto;
`;

const Section = styled.div`
  padding: 20px 0;
`;

const SectionHead = styled.div`
  font-size: 18px;
  padding: 20px 0;
  color: ${(p) => (p.error ? "#ea2e49" : "#6490f1")};
`;

const SectionBody = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const CoinContainer = styled.div`
  width: 80px;
  padding: 4px;
`;

const IconWrapper = styled.div`
  color: ${(p) => p.color};
  background-color: ${(p) => p.bg};
  border-radius: 8px;
  display: flex;
  overflow: hidden;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: ${(p) => p.size}px;
  height: ${(p) => p.size}px;
  margin-right: 10px;
`;

const CryptoName = styled.div`
  padding: 6px;
  font-size: 12px;
  font-weight: bold;
`;

const AltIcon = styled.div`
  font-size: 24px;
`;

const CoinPreview = ({ coin }: { coin: CryptoCurrency }) => {
  const text = coin.managerAppName;
  const Icon = getCryptoCurrencyIcon(coin);
  return (
    <CoinContainer>
      <IconWrapper size={60} bg={coin.color} color="white">
        {Icon ? <Icon size={30} /> : <AltIcon>{coin.ticker}</AltIcon>}
      </IconWrapper>
      <CryptoName>{text}</CryptoName>
    </CoinContainer>
  );
};

const AppPreview = ({ app }: *) => {
  return (
    <CoinContainer>
      <img alt="" src={manager.getIconUrl(app.icon)} width={60} height={60} />
      <CryptoName>{`${app.name} ${app.version}`}</CryptoName>
    </CoinContainer>
  );
};

const AppWithCoinPreview = ({ app }: *) => {
  return <AppPreview app={app} />;
};

const choices = [
  {
    label: "Nano S 1.6.1",
    deviceInfo: {
      version: "1.6.1",
      mcuVersion: "1.12",
      majMin: "1.6",
      providerName: null,
      targetId: 823132164,
      isOSU: false,
      isBootloader: false,
      managerAllowed: false,
      pinValidated: true,
    },
  },
  {
    label: "Nano S 1.5.5",
    deviceInfo: {
      version: "1.5.5",
      mcuVersion: "1.7",
      majMin: "1.5",
      providerName: null,
      targetId: 823132164,
      isOSU: false,
      isBootloader: false,
      managerAllowed: false,
      pinValidated: true,
    },
  },
  {
    label: "Nano X 1.2.4-5",
    deviceInfo: {
      version: "1.2.4-5",
      mcuVersion: "2.10",
      majMin: "1.2",
      providerName: null,
      targetId: 855638020,
      isOSU: false,
      isBootloader: false,
      managerAllowed: false,
      pinValidated: true,
    },
  },
];

const providers = [
  { label: "production (provider 1)", value: 1 },
  { label: "beta (provider 4)", value: 4 },
];

const Apps = () => {
  const [apps, setApps] = useState([]);
  const [choice, setChoice] = useState(choices[0]);
  const [provider, setProvider] = useState(providers[0]);

  useEffect(() => {
    setApps([]);
    setEnv("FORCE_PROVIDER", provider.value);
    manager.getAppsList(choice.deviceInfo).then(setApps);
  }, [choice, provider]);

  const unknownApps = [];
  const knownAppsWithCoin = [];
  const deprecatedApps = [];
  apps.forEach((app) => {
    const coin = coins.find((c) => app.name === c.managerAppName);
    if (coin) {
      knownAppsWithCoin.push({
        app,
        coin,
      });
    } else if (!manager.canHandleInstall(app)) {
      deprecatedApps.push(app);
    } else {
      unknownApps.push(app);
    }
  });
  const notFoundCryptoCurrencies =
    apps.length === 0
      ? []
      : coins.filter(
          (c) =>
            c.managerAppName &&
            !apps.find((app) => app.name === c.managerAppName)
        );

  return (
    <Container>
      <h1>Manager apps for device</h1>

      <Select
        value={choice}
        options={choices}
        onChange={setChoice}
        getOptionLabel={(c) => c.label}
        getOptionValue={(c) => c.label}
      />

      <p />

      <Select
        value={provider}
        options={providers}
        onChange={setProvider}
        getOptionLabel={(c) => c.label}
        getOptionValue={(c) => c.label}
      />

      {apps.length === 0 ? (
        <Section>
          <SectionHead>Loading...</SectionHead>
        </Section>
      ) : null}

      {notFoundCryptoCurrencies.length > 0 ? (
        <Section>
          <SectionHead error>
            {"can't find a Manager app for these crypto-currencies"}
          </SectionHead>
          <SectionBody>
            {notFoundCryptoCurrencies.map((coin) => (
              <CoinPreview key={coin.id} coin={coin} />
            ))}
          </SectionBody>
        </Section>
      ) : null}
      {unknownApps.length > 0 ? (
        <Section>
          <SectionHead error>
            {"can't find crypto-currencies corresponding to these Manager apps"}
          </SectionHead>
          <SectionBody>
            {unknownApps.map((app) => (
              <AppPreview key={app.name} app={app} />
            ))}
          </SectionBody>
        </Section>
      ) : null}
      {knownAppsWithCoin.length > 0 ? (
        <Section>
          <SectionHead>Apps correctly recognized by Live</SectionHead>
          <SectionBody>
            {knownAppsWithCoin.map((all) => (
              <AppWithCoinPreview key={all.app.name} {...all} />
            ))}
          </SectionBody>
        </Section>
      ) : null}
      {deprecatedApps.length > 0 ? (
        <Section>
          <SectionHead>
            {"Apps recognized as "}
            <strong>deprecated</strong>
            {" by Live (no install available)"}
          </SectionHead>
          <SectionBody>
            {deprecatedApps.map((app) => (
              <AppPreview key={app.name} app={app} />
            ))}
          </SectionBody>
        </Section>
      ) : null}
    </Container>
  );
};

Apps.demo = {
  title: "Apps",
  url: "/apps",
  hidden: true,
};

export default Apps;

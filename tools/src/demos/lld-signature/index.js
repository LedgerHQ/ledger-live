// @flow
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Select from "react-select";
import logoSvg from "../../ledgerlive-logo.svg";

const Main = styled.div`
  padding-bottom: 100px;
  margin: 20px auto;
  max-width: 600px;

  h1 {
    font-size: 1.6em;
    img {
      vertical-align: middle;
    }
  }

  h2 {
    font-size: 1.4em;
    margin-top: 2em;
  }
`;

const Field = styled.div`
  margin-bottom: 20px;
`;

const FieldHeader = styled.div`
  display: flex;
  flex-direction: row;
`;

const Label = styled.label`
  flex: 1;
  color: #999;
  padding: 0.2em 0;
`;

const Textarea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
`;

const Block = styled.div`
  color: #888;
  padding: 8px 0;
  margin-bottom: 1em;
  font-family: serif;
  font-size: 1.2em;
  line-height: 1.4em;
`;

const BlockCode = styled.pre`
  background-color: #555;
  color: #ddd;
  padding: 10px 20px;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ledgerlivepem = `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEN7qcsG6bogi1nkD3jnMWS813wWguYEcI
CRcijSvFskSFjHB5la4xUt+Omb2t6iUwop+JRy+EUhy0UQ9p/cPsQA==
-----END PUBLIC KEY-----
`;

const Download = ({ name, href }) => {
  return (
    <a
      style={{ color: "#000", textDecoration: "underline" }}
      download={name}
      href={href}
    >
      {name}
    </a>
  );
};

const LiveDownloadOptions = ({ release }) => {
  return (
    <ul>
      {release.assets
        .filter((a) =>
          [".AppImage", "mac.dmg", ".exe"].some((s) => a.name.endsWith(s))
        )
        .map((a) => (
          <li>
            <Download name={a.name} href={a.browser_download_url} />
          </li>
        ))}
    </ul>
  );
};

const LLDSignature = () => {
  const [releases, setReleases] = useState(null);
  const [release, selectRelease] = useState(null);
  const [checksums, setChecksums] = useState(null);
  const [checksumsSig, setChecksumsSig] = useState(null);
  const [checksumsFetchError, setChecksumsFetchError] = useState(null);

  const version = release && release.tag_name.slice(1);
  const checksumsFilename =
    version && `ledger-live-desktop-${version}.sha512sum`;
  const checksumsUrl =
    checksumsFilename &&
    `https://resources.live.ledger.app/public_resources/signatures/${checksumsFilename}`;

  useEffect(() => {
    let gone;
    fetch("https://api.github.com/repos/LedgerHQ/ledger-live-desktop/releases")
      .then((r) => r.json())
      .then((releases) => {
        if (gone) return;
        setReleases(releases.filter((r) => r.tag_name.startsWith("v")));
      });
    return () => {
      gone = true;
    };
  }, []);

  useEffect(() => {
    if (!releases) return;
    selectRelease(releases.find((r) => !r.prerelease));
  }, [releases]);

  useEffect(() => {
    let gone;
    if (!checksumsUrl) return;
    setChecksumsFetchError(null);
    setChecksums(null);
    setChecksumsSig(null);

    const throwOnErrorPayload = (r) => {
      if (r.status >= 400) {
        throw new Error("The checksums didn't exist on that version.");
      }
      return r;
    };

    Promise.all([
      fetch(checksumsUrl)
        .then(throwOnErrorPayload)
        .then((r) => r.text()),
      fetch(checksumsUrl + ".sig")
        .then(throwOnErrorPayload)
        .then((r) => r.blob()),
    ])
      .then(([checksums, checksumsSig]) => {
        if (gone) return;
        setChecksums(checksums);
        setChecksumsSig(URL.createObjectURL(checksumsSig));
      })
      .catch((e) => {
        if (gone) return;
        setChecksumsFetchError(e);
      });
    return () => {
      gone = true;
    };
  }, [checksumsUrl]);

  return (
    <Main>
      <h1>
        <img alt="" src={logoSvg} height="32" /> Ledger Live releases
      </h1>

      <Field>
        <FieldHeader>
          <Label for="release">Ledger Live release</Label>
        </FieldHeader>
        <Select
          id="release"
          value={release}
          options={releases}
          onChange={selectRelease}
          placeholder="Ledger Live Release"
          getOptionLabel={(r) => `${r.tag_name}`}
          getOptionValue={(r) => r.tag_name}
        />
        {release ? <LiveDownloadOptions release={release} /> : null}
      </Field>

      <h2>Verify my Ledger Live install binary</h2>

      <Block>
        You can verify the authenticity of the Ledger Live binary installation
        file by comparing its <strong>sha512</strong> hash to the one available
        in this file:
      </Block>

      {checksums ? (
        <>
          <Field>
            <FieldHeader>
              <Label for="checksums">sha512sum hashes</Label>
              <Download
                href={`data:text/plain;base64,${btoa(checksums)}`}
                name={checksumsFilename}
              />
            </FieldHeader>
            <Textarea
              id="checksums"
              style={{ minHeight: 100 }}
              value={checksums}
            />
          </Field>

          <BlockCode>
            {checksums
              .split("\n")
              .filter(Boolean)
              .map((line) => {
                const [hash, filename] = line.split(/\s+/);
                const cmd = filename.endsWith(".AppImage")
                  ? `sha512sum ${filename}`
                  : filename.endsWith(".exe")
                  ? `Get-FileHash ${filename} -Algorithm SHA512`
                  : `shasum -a 512 ${filename}`;
                return `$ ${cmd}\n${hash}\n`;
              })
              .join("\n")}
          </BlockCode>
        </>
      ) : checksumsFetchError ? (
        <p>Couldn't load the hashes: {checksumsFetchError.message}</p>
      ) : (
        <p>Loading...</p>
      )}

      {checksums &&
      checksumsFilename &&
      checksumsSig &&
      !checksumsFetchError ? (
        <>
          <h2>Verify the sha512sum hashes</h2>

          <Block>
            For extra security, you should also check that the sha512 hashes
            published in the file <code>{checksumsFilename}</code> are indeed
            signed by Ledger. A multi-signature setup is used internally using
            Ledger Nano S devices to mitigate a malicious insider attack.
          </Block>

          <Field>
            <FieldHeader>
              <Label>This is Ledger Live's OpenSSL public key (ECDSA)</Label>
              <Download
                href={`data:application/x-pem-file;base64,${btoa(
                  ledgerlivepem
                )}`}
                name="ledgerlive.pem"
              />
            </FieldHeader>
            <Textarea style={{ height: 80 }}>{ledgerlivepem}</Textarea>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/LedgerHQ/ledger-live-desktop/blob/master/src/main/updater/ledger-pubkey.js"
            >
              as embedded in Ledger Live source code
            </a>
          </Field>

          <Field>
            <FieldHeader>
              <Label>Signature of sha512sum hashes file:</Label>
            </FieldHeader>
            <Download href={checksumsSig} name={checksumsFilename + ".sig"} />
          </Field>

          <BlockCode>
            {`$ openssl dgst -sha256 -verify ledgerlive.pem -signature ${checksumsFilename}.sig ${checksumsFilename}

Verified OK`}
          </BlockCode>

          <h2>What about automatic updates</h2>

          <Block>
            The update mechanism is secured once you've verified and installed
            Ledger Live. Ledger Live checks each upcoming update against
            Ledger's public key to verify that the update is legitimately from
            Ledger.
          </Block>
        </>
      ) : null}
    </Main>
  );
};

// $FlowFixMe
LLDSignature.demo = {
  title: "Ledger Live Desktop signatures",
  url: "/lld-signatures",
};

export default LLDSignature;

import React, { useCallback, useState } from "react";
import { tlvParser } from "@ledgerhq/domain-service/tools/index";

export const getStaticProps = async () => ({ props: {} });

const App = () => {
  const [domainAPDU, setDomainAPDU] = useState("");
  const [parsedAPDU, setParsedAPDU] = useState<ReturnType<typeof tlvParser>>([]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDomainAPDU(e.target.value);
  }, []);
  const onSubmit = useCallback(() => {
    setParsedAPDU(tlvParser(domainAPDU));
  }, [domainAPDU]);

  return (
    <>
      <input
        type="text"
        onChange={onChange}
        value={domainAPDU}
        placeholder="Enter the Domain APDU"
      />
      <button onClick={onSubmit}>Parse TLV</button>

      {parsedAPDU
        ? parsedAPDU.map(({ T, L, V }, i) => (
            <ul key={i} data-key={i}>
              <li>T: {T}</li>
              <li>L: {L}</li>
              <li>V: {V}</li>
            </ul>
          ))
        : null}
    </>
  );
};

export default App;

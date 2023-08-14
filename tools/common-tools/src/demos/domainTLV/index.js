import React, { useCallback, useState } from "react";
import { tlvParser } from "@ledgerhq/domain-service/tools/index";

const App = () => {
  const [domainAPDU, setDomainAPDU] = useState("");
  const [parsedAPDU, setParsedAPDU] = useState([]);

  const onChange = useCallback((e) => {
    setDomainAPDU(e.target.value);
  }, []);
  const onSubmit = useCallback(() => {
    setParsedAPDU(tlvParser(domainAPDU));
  }, [domainAPDU])

  return (
    <>
      <input type="text" onChange={onChange} value={domainAPDU} placeholder="Enter the Domain APDU" />
      <button onClick={onSubmit}>Parse TLV</button>

      {parsedAPDU ?
        parsedAPDU.map(({ T, L, V }, i) => (
          <ul key={i} data-key={i}>
            <li>T: {T}</li>
            <li>L: {L}</li>
            <li>V: {V}</li>
          </ul>
        ))
        : null}
    </>
  )
};

App.demo = {
  title: "Domain TLV Parser",
  url: "/domain-tlv-parser",
};

export default App;
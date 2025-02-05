import { Operation } from "@ledgerhq/types-live";
import React, { useRef, useState, useEffect } from "react";
import Box from "../../Box";
import SectionTitle from "../SectionTitle";

export const OperationGroup = ({
  group,
  validOperations,
}: {
  group: { day: Date; data: Operation[] };
  validOperations: JSX.Element[] | null;
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [hasValidOperations, setHasValidOperations] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (boxRef.current) {
        setHasValidOperations(boxRef.current.childElementCount > 0);
      }
    });

    if (boxRef.current) {
      observer.observe(boxRef.current, { childList: true });
      setHasValidOperations(boxRef.current.childElementCount > 0);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="operation-group">
      {hasValidOperations && <SectionTitle date={group.day} className="section-title" />}
      <Box id="box" ref={boxRef} p={0}>
        {validOperations}
      </Box>
    </div>
  );
};

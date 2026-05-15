import React from "react";

type Props = {
  used: number;
  limit: number;
};

const CharCounter = ({ used, limit }: Props) => {
  const over = used > limit;
  return (
    <p className={`body-3 ${over ? "text-error" : "text-muted"}`}>
      {used}/{limit} characters
    </p>
  );
};

export default CharCounter;

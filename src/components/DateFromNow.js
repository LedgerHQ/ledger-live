// @flow
import React from "react";
import { Trans } from "react-i18next";

const k = 60;
const M = ["seconds", "minutes", "hours", "days"];

const DateFromNow = ({ date }: { date: number }) => {
  const diff = (date - Date.now()) / 1000;

  const i = Math.floor(Math.log(diff) / Math.log(k));
  const time = parseFloat((diff / k ** i).toFixed(0));

  return (
    <Trans i18nKey={`common.fromNow.${M[i]}`} count={time} values={{ time }} />
  );
};

export default DateFromNow;

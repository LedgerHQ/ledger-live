// @flow
import React from "react";
import { Trans } from "react-i18next";

const k = 60;
const j = 24;
const M = ["seconds", "minutes", "hours", "days"];

const DateFromNow = ({ date }: { date: number }) => {
  const diff = (date - Date.now()) / 1000;

  let i = Math.floor(Math.log(diff) / Math.log(k));
  let time = parseFloat((diff / k ** Math.min(2, i)).toFixed(0));

  if (i > 1 && time >= j) {
    i = 3;
    time = parseFloat((time / j).toFixed(0));
  }

  return (
    <Trans i18nKey={`common.fromNow.${M[i]}`} count={time} values={{ time }} />
  );
};

export default DateFromNow;

import React from "react";
import { Error } from "../../components/Error";
import { Success } from "../../components/Success";

type Props = {
  goNext: () => void;
};

export default function StepThree({ goNext }: Props) {
  return <Error title={"Title"} description={"Error description"} />;
}

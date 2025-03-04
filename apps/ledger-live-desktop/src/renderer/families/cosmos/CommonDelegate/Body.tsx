import React, { useState, useCallback } from "react";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { useForm, SubmitHandler } from "react-hook-form";

export type Data = {
  account: CosmosAccount;
  source?: string;
};

type Inputs = {
  example: string,
  exampleRequired: string,
};


type FormData = {
  firstName: string;
  lastName: string;
};


export const Body = () => {
  
  const { register, setValue, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      firstName: "bill",
      lastName: "luo"
    }
  });
  const onSubmit = handleSubmit(data => console.log(data));
  // firstName and lastName will have correct type

  return (
    <form onSubmit={onSubmit}>
      <label>First Name</label>
      <input {...register("firstName")} />
      <label>Last Name</label>
      <input {...register("lastName")} />
      <button
        type="button"
        onClick={() => {
          setValue("lastName", "luo"); // ✅
          // setValue("firstName", true); // ❌: true is not string
          // errors.bill; // ❌: property bill does not exist
        }}
      >
        SetValue
      </button>
    </form>
  );
};

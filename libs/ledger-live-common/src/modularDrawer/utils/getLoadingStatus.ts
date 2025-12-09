import { LoadingStatus } from "../../deposit/type";
import { SerializedError } from "@reduxjs/toolkit";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

export const getLoadingStatus = ({
  isLoading,
  isSuccess,
  error,
}: {
  isLoading: boolean;
  isSuccess: boolean;
  error?: FetchBaseQueryError | SerializedError;
}): LoadingStatus => {
  if (isLoading) {
    return LoadingStatus.Pending;
  }
  if (error) {
    return LoadingStatus.Error;
  }
  if (isSuccess) {
    return LoadingStatus.Success;
  }
  return LoadingStatus.Idle;
};

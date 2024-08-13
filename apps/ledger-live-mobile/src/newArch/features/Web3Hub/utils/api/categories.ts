import network from "@ledgerhq/live-network/network";
import { URL_ORIGIN } from "LLM/features/Web3Hub/constants";
import { mocks } from "./mocks/categories";

const MOCK_DELAY = 500;

export const fetchCategoriesMock = async () => {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  return mocks;
};

export type Category = {
  id: string;
  name: string;
};

export const fetchCategories = async () => {
  const url = new URL(`${URL_ORIGIN}/api/v2/categories`);

  const res = await network<Category[]>({
    url: url.toString(),
  });
  return res.data;
};

export const selectCategories = (data: Category[]) => {
  return [{ id: "all", name: "all" }, ...data];
};

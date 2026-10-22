export type AccountRouteParams = Readonly<{
  id?: string;
  parentId?: string;
  "*"?: string;
}>;

/** Legacy links carry a raw account id, whose slashes react-router hands over in the splat. */
export function getAccountRouteSegments({ id, parentId, "*": splat }: AccountRouteParams) {
  const accountSegment =
    id && parentId && splat && splat.indexOf("account/") === -1 ? `${id}/${splat}` : id;
  return { accountSegment, parentSegment: parentId };
}

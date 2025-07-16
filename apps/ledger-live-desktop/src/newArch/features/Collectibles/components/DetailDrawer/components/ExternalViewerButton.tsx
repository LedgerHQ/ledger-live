import React, { useCallback, memo, ReactElement } from "react";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import { ExternalViewerButtonProps } from "LLD/features/Collectibles/types/DetailDrawer";
import { ItemType } from "LLD/features/Collectibles/types/enum/Links";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import DropDownSelector, { DropDownItem } from "~/renderer/components/DropDownSelector";
import IconExternal from "~/renderer/icons/ExternalLink";
import useNftLinks from "LLD/features/Collectibles/hooks/useNftLinks";
import { setDrawer } from "~/renderer/drawers/Provider";
import { Icons } from "@ledgerhq/react-ui";

const Separator = styled.div`
  background-color: ${p => p.theme.colors.palette.divider};
  height: 1px;
  margin-top: 8px;
  margin-bottom: 8px;
`;

const Item = memo(styled(DropDownItem)`
  width: 100%;
  cursor: pointer;
  white-space: pre-wrap;
  justify-content: space-between;
  align-items: center;
  display: flex;
`);

type Inner<A> = A extends Array<infer T> ? T : never;
type Item = Inner<ReturnType<typeof useNftLinks>>;

const ExternalViewerButtonComponent: React.FC<ExternalViewerButtonProps> = ({
  nft,
  account,
  metadata,
}: ExternalViewerButtonProps) => {
  const history = useHistory();

  const onHideCollection = useCallback(() => {
    setDrawer();
    history.replace(`/account/${account.id}/`);
  }, [account.id, history]);

  const items = useNftLinks(account, nft, metadata, onHideCollection);

  const renderItem = ({ item }: { item: Item }): ReactElement => {
    if (item.type === ItemType.SEPARATOR) {
      return <Separator />;
    }

    const Icon = item.Icon
      ? // TODO: the icons have incompatible props (size: string / number)
        // eslint-disable-next-line
        React.createElement(item.Icon as any, {
          size: 16,
        })
      : null;

    return (
      <Item id={`external-popout-${item.id}`} horizontal flow={2} onClick={item.callback}>
        <Box horizontal>
          {Icon && <Box mr={2}>{Icon}</Box>}
          {item.label}
        </Box>
        {item.type === ItemType.EXTERNAL && (
          <Box ml={4}>
            <IconExternal size={16} />
          </Box>
        )}
      </Item>
    );
  };

  return (
    <DropDownSelector buttonId="accounts-options-button" items={items} renderItem={renderItem}>
      {() => (
        <Box horizontal>
          <Button
            data-testid="external-viewer-button"
            small
            primary
            flow={1}
            style={{
              height: 40,
            }}
          >
            <Icons.MoreHorizontal size="S" />
          </Button>
        </Box>
      )}
    </DropDownSelector>
  );
};

export const ExternalViewerButton = memo<ExternalViewerButtonProps>(ExternalViewerButtonComponent);

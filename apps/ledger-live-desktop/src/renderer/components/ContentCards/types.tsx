export type ContentCardProps = {
  metadata: ContentCardMetadata;
};

export type ContentCardMetadata = {
  id: string;

  actions?: {
    onView?: () => void;
    onClick?: Function;
    onDismiss?: Function;
  };
};

/**
 * Defines a content card item.
 */
export interface ContentCardItem<P extends ContentCardProps = ContentCardProps> {
  component: React.FC<P & ContentCardProps>;
  props: P & ContentCardProps;
}

export interface ContentLayoutProps<T extends ContentCardProps> {
  items: ContentCardItem<T>[];
}

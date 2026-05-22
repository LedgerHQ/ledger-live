type SectionHeaderBaseProps = Readonly<{
  title: string;
  actionLabel?: string;
  onActionClick?: () => void;
  actionTestId?: string;
}>;

export type SectionHeaderWithSeeAllProps = SectionHeaderBaseProps &
  Readonly<{
    showSeeAll: true;
    itemCount: number;
    onSeeAllClick: () => void;
    seeAllTestId: string;
  }>;

export type SectionHeaderWithoutSeeAllProps = SectionHeaderBaseProps &
  Readonly<{
    showSeeAll?: false;
  }>;

export type SectionHeaderProps = SectionHeaderWithSeeAllProps | SectionHeaderWithoutSeeAllProps;

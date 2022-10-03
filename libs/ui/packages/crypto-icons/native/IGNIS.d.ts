/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function IGNIS({ size, color }: Props): JSX.Element;
declare namespace IGNIS {
    var DefaultColor: string;
}
export default IGNIS;

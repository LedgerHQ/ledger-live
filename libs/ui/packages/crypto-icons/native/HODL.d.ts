/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function HODL({ size, color }: Props): JSX.Element;
declare namespace HODL {
    var DefaultColor: string;
}
export default HODL;

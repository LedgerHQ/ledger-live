/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BLOCK({ size, color }: Props): JSX.Element;
declare namespace BLOCK {
    var DefaultColor: string;
}
export default BLOCK;

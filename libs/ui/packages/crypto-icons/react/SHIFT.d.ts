/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SHIFT({ size, color }: Props): JSX.Element;
declare namespace SHIFT {
    var DefaultColor: string;
}
export default SHIFT;

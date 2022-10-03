/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BTCH({ size, color }: Props): JSX.Element;
declare namespace BTCH {
    var DefaultColor: string;
}
export default BTCH;

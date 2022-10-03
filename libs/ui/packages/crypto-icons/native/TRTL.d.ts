/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TRTL({ size, color }: Props): JSX.Element;
declare namespace TRTL {
    var DefaultColor: string;
}
export default TRTL;

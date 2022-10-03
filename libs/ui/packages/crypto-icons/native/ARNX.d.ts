/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ARNX({ size, color }: Props): JSX.Element;
declare namespace ARNX {
    var DefaultColor: string;
}
export default ARNX;

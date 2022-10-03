/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ZCL({ size, color }: Props): JSX.Element;
declare namespace ZCL {
    var DefaultColor: string;
}
export default ZCL;

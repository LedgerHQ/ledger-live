/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XMO({ size, color }: Props): JSX.Element;
declare namespace XMO {
    var DefaultColor: string;
}
export default XMO;

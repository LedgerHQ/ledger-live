/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function RYO({ size, color }: Props): JSX.Element;
declare namespace RYO {
    var DefaultColor: string;
}
export default RYO;

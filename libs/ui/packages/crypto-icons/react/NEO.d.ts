/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NEO({ size, color }: Props): JSX.Element;
declare namespace NEO {
    var DefaultColor: string;
}
export default NEO;

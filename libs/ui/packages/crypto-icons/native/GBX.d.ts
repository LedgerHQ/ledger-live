/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GBX({ size, color }: Props): JSX.Element;
declare namespace GBX {
    var DefaultColor: string;
}
export default GBX;

/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SSV({ size, color }: Props): JSX.Element;
declare namespace SSV {
    var DefaultColor: string;
}
export default SSV;

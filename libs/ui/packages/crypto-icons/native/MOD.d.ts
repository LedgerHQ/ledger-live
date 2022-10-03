/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MOD({ size, color }: Props): JSX.Element;
declare namespace MOD {
    var DefaultColor: string;
}
export default MOD;

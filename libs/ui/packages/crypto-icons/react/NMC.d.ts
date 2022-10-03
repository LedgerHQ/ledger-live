/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NMC({ size, color }: Props): JSX.Element;
declare namespace NMC {
    var DefaultColor: string;
}
export default NMC;

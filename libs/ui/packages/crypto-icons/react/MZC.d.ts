/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MZC({ size, color }: Props): JSX.Element;
declare namespace MZC {
    var DefaultColor: string;
}
export default MZC;

/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function WAVES({ size, color }: Props): JSX.Element;
declare namespace WAVES {
    var DefaultColor: string;
}
export default WAVES;

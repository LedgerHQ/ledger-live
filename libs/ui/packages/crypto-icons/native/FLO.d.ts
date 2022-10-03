/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function FLO({ size, color }: Props): JSX.Element;
declare namespace FLO {
    var DefaultColor: string;
}
export default FLO;

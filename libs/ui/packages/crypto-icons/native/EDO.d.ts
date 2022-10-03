/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function EDO({ size, color }: Props): JSX.Element;
declare namespace EDO {
    var DefaultColor: string;
}
export default EDO;

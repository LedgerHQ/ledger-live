/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GNO({ size, color }: Props): JSX.Element;
declare namespace GNO {
    var DefaultColor: string;
}
export default GNO;

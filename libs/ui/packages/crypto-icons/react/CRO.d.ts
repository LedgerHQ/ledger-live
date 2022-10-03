/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CRO({ size, color }: Props): JSX.Element;
declare namespace CRO {
    var DefaultColor: string;
}
export default CRO;

/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CRW({ size, color }: Props): JSX.Element;
declare namespace CRW {
    var DefaultColor: string;
}
export default CRW;

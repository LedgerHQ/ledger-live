/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TAAS({ size, color }: Props): JSX.Element;
declare namespace TAAS {
    var DefaultColor: string;
}
export default TAAS;

/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TPAY({ size, color }: Props): JSX.Element;
declare namespace TPAY {
    var DefaultColor: string;
}
export default TPAY;

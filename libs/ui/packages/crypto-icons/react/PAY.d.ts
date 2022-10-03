/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function PAY({ size, color }: Props): JSX.Element;
declare namespace PAY {
    var DefaultColor: string;
}
export default PAY;

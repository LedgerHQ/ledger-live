/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ATM({ size, color }: Props): JSX.Element;
declare namespace ATM {
    var DefaultColor: string;
}
export default ATM;

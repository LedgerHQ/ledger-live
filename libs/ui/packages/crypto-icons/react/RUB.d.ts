/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function RUB({ size, color }: Props): JSX.Element;
declare namespace RUB {
    var DefaultColor: string;
}
export default RUB;

/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XAS({ size, color }: Props): JSX.Element;
declare namespace XAS {
    var DefaultColor: string;
}
export default XAS;

/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CTR({ size, color }: Props): JSX.Element;
declare namespace CTR {
    var DefaultColor: string;
}
export default CTR;

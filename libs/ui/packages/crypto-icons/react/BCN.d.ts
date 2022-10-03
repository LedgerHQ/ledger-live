/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BCN({ size, color }: Props): JSX.Element;
declare namespace BCN {
    var DefaultColor: string;
}
export default BCN;

/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function ION({ size, color }: Props): JSX.Element;
declare namespace ION {
    var DefaultColor: string;
}
export default ION;

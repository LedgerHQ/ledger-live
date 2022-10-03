/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function EON({ size, color }: Props): JSX.Element;
declare namespace EON {
    var DefaultColor: string;
}
export default EON;

/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DROP({ size, color }: Props): JSX.Element;
declare namespace DROP {
    var DefaultColor: string;
}
export default DROP;

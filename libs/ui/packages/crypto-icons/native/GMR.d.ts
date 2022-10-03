/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GMR({ size, color }: Props): JSX.Element;
declare namespace GMR {
    var DefaultColor: string;
}
export default GMR;

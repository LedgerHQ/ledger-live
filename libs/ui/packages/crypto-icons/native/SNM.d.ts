/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SNM({ size, color }: Props): JSX.Element;
declare namespace SNM {
    var DefaultColor: string;
}
export default SNM;

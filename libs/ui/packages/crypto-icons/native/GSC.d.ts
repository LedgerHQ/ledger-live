/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GSC({ size, color }: Props): JSX.Element;
declare namespace GSC {
    var DefaultColor: string;
}
export default GSC;

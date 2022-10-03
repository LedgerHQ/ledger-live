/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function PAC({ size, color }: Props): JSX.Element;
declare namespace PAC {
    var DefaultColor: string;
}
export default PAC;

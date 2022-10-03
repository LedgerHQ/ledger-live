/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DASH({ size, color }: Props): JSX.Element;
declare namespace DASH {
    var DefaultColor: string;
}
export default DASH;

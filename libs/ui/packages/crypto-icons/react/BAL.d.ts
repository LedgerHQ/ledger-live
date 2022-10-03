/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BAL({ size, color }: Props): JSX.Element;
declare namespace BAL {
    var DefaultColor: string;
}
export default BAL;

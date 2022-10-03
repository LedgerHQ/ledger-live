/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BDL({ size, color }: Props): JSX.Element;
declare namespace BDL {
    var DefaultColor: string;
}
export default BDL;

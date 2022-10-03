/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BEAM({ size, color }: Props): JSX.Element;
declare namespace BEAM {
    var DefaultColor: string;
}
export default BEAM;

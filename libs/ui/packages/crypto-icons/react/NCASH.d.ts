/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NCASH({ size, color }: Props): JSX.Element;
declare namespace NCASH {
    var DefaultColor: string;
}
export default NCASH;

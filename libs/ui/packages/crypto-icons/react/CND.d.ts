/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CND({ size, color }: Props): JSX.Element;
declare namespace CND {
    var DefaultColor: string;
}
export default CND;

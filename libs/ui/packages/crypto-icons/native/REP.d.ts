/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function REP({ size, color }: Props): JSX.Element;
declare namespace REP {
    var DefaultColor: string;
}
export default REP;

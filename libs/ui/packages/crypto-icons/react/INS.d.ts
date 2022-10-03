/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function INS({ size, color }: Props): JSX.Element;
declare namespace INS {
    var DefaultColor: string;
}
export default INS;

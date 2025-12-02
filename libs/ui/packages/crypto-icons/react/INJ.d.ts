/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function INJ({ size, color }: Props): JSX.Element;
declare namespace INJ {
    var DefaultColor: string;
}
export default INJ;

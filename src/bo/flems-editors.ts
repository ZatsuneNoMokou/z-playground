import { IFlemOptions } from "./flems.js";

export interface IEditorData {
	files: IFlemOptions['files'];
	libs: string[];
}

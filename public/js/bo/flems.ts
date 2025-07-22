export interface IEditorData {
	files: IFlemOptions['files'];
	links: string[];
	selected?: string;
}

export type FlemInstance = {
	reload(): void
	focus(): void
	redraw(): void

	set(data:IFlemOptions): void

	onchange(fn: (state: IFlemOptions) => void): void
	onload(fn: () => void): void
	onloaded(fn: (state: IFlemOptions) => void): void
}

export interface IFlemOptions_file {
	name: string,
	content: string
	compiler?: string | Function
	selections?: string
	doc?: any
	type?: string
}
export interface IFlemOptions {
	files: IFlemOptions_file[],
	links: {
		name: string,
		type: string,
		url: string
	}[],

	middle?: number,
	selected?: string, // '.js',
	color?: string, // 'rgb(38,50,56)',
	theme?: 'material' | 'none' | 'default', // and 'none' or 'default'
	resizeable?: boolean,
	editable?: boolean,
	toolbar?: boolean,
	fileTabs?: boolean,
	linkTabs?: boolean,
	shareButton?: boolean,
	reloadButton?: boolean,
	console?: boolean,
	autoReload?: boolean,
	autoReloadDelay?: number,
	autoHeight?: boolean
}

import {IEditorData, IFlemOptions, FlemInstance} from "./bo/flems.js";



declare var Flems : (target:HTMLElement, opts: IFlemOptions, runtimeUrl?:string) => FlemInstance;
let flemInstance : FlemInstance|null = null;



let editorData: IEditorData;

const defaultEditors: IEditorData = {
	files: [
		{
			name: 'app.html',
			content: '<h3>No need to write &lt;body&gt; &lt;/body&gt;</h3>'
		},
		{
			name: 'app.css',
			content: 'body {\n\tpadding: 0;\n}\nbody.red {\n\tbackground: rgba(200,0,0,0.2);\n}'
		},
		{
			name: 'app.js',
			content: 'console.dir(location.href);'
		},
	],
	links: [],
}
async function init(data: IEditorData=defaultEditors) {
	const search = new URLSearchParams(window.location.search),
		id = search.get('id');
	if (id !== null) {
		const idData = await (await fetch(`/data/${id}.json`)).json();
		if (idData && typeof idData === 'object') {
			data = editorData = {
				files: Array.isArray(idData.files) ? idData.files : defaultEditors.files,
				links: Array.isArray(idData.links) ? idData.links : defaultEditors.links,
			};
		} else {
			throw new Error(`Could not find valid data from ${JSON.stringify(id)}`);
		}
	}

	console.info('init');
	let opts : IFlemOptions = {
		theme: 'material',

		fileTabs: true,
		linkTabs: true,
		reloadButton: true,
		console: true,
		shareButton: false,

		files: data.files,
		selected: data.files.find(file => {
			return file.name.endsWith('.js')
		})?.name,
		links: data.links
			.map(lib => {
				return {
					name: lib,
					type: 'script',
					url: 'https://unpkg.com/' + lib
				}
			})
	};
	flemInstance = Flems(document.body, opts, '/flems/runtime.html');

	flemInstance.onchange(function (instance) {
		editorData = {
			files: instance.files,
			links: instance.links.map(lib => lib.name),
		};
	});
}


init()
	.catch(console.error);


document.addEventListener('keydown', function(event) {
	// Check if Ctrl (or Cmd on Mac) key is pressed and S key is pressed
	if ((event.ctrlKey || event.metaKey) && event.key === 's') {
		// Prevent the default save action
		event.preventDefault();

		saveDocument()
			.catch(console.error);
	}
});

async function saveDocument() {
	const search = new URLSearchParams(window.location.search),
		id = search.get('id'),
		params = new URLSearchParams();

	if (id !== null) {
		params.append('id', id);
	}

	const data = {
		files: editorData.files.map(file => {
			return {
				name: file.name,
				content: file.content,
				selections: file.selections,
			}
		}),
		links: editorData.links,
	};
	const result = await (await fetch(`/save?${params.toString()}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	})).json();

	if (result.error) {
		throw new Error(result.error);
	}

	const resultId = result.data.id;
	if (!resultId || typeof resultId !== 'string') {
		throw new Error(`${resultId} is not a valid id`);
	}


	const url = new URL(location.href);
	if (url.searchParams.get('id') === null || !url.searchParams.get('id')) {
		url.searchParams.set('id', resultId);
		history.pushState({ id: id }, '', `${window.location.pathname}?${url.searchParams.toString()}`);
	}
}

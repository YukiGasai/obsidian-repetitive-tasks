import { Editor, MarkdownFileInfo, MarkdownView, Plugin } from 'obsidian';

export default class RepetitiveTasksPlugin extends Plugin {
	lastTriggered = 0;

	async onload() {

		this.registerDomEvent(document, 'click', async (event: MouseEvent) => {

			const target = event.target as HTMLElement;
			if(
				!(target instanceof HTMLInputElement)
				|| target.type !== 'checkbox'
				|| !target.classList.contains('task-list-item-checkbox')
			) {
				return false;
			}
			//@ts-ignore

			const currentView = this.app.workspace.getActiveViewOfType(MarkdownView);
			const currentFile = currentView?.file;
			const currentMode = currentView?.getMode();

			// Don't use the listener if the current view is not in preview mode
			if(currentMode !== 'preview') {
				return false;
			}
			
			// Get the parent line of the checkbox
			const line = target.closest('.task-list-item');
			if(!line) {
				return false;
			}
			// Get the text of the line to identify the todo
			const text = line.textContent;
			if(!text) {
				return false;
			}
			// Get the current editor
			const editor = currentView?.editor;
			if(!editor) {
				return false;
			}
			// Get the content of the editor before and after the change
	
			const contentBeforeChange = await this.app.vault.cachedRead(currentFile);
			
			// The updated checkbox will always be empty [ ] except if it was empty because the checkbox gets checked evert time the listener is triggered and the count is increased
			// This means the after can only be used to check what line was changed not to get the last count
			//@ts-ignore
			const contentAfterChange = currentView.data;

			// Split the content into lines
			const contentBeforeChangeLines = contentBeforeChange.split('\n');
			const contentAfterChangeLines = contentAfterChange.split('\n');

			// Find the first line that changed
			let lineIndex = 0;
			for (;lineIndex < contentBeforeChangeLines.length; lineIndex++) {
				if(contentBeforeChangeLines[lineIndex]	!== contentAfterChangeLines[lineIndex]) {
					break;
				}
			}

			//No change detected
			if(lineIndex === contentBeforeChangeLines.length) {
				return;
			}
			
			// Get the the todo from the line
			const todoRegexOld = /^([^\S\r\n]*)- \[(.)] (.*#(\d).*)$/gm
			const todoRegexNew = /^([^\S\r\n]*)- \[(.)] (.*#(\d).*)$/gm

			const todoMatchOld = todoRegexOld.exec(contentBeforeChangeLines[lineIndex]);
			const todoMatchNew = todoRegexNew.exec(contentAfterChangeLines[lineIndex]);

			// No todo with repeat detected
			if(!todoMatchOld || !todoMatchNew) {
				return;
			}

			const todo = {
				indent: todoMatchNew[1],
				state: line.getAttribute('data-task'),
				text: todoMatchNew[3],
				count: -1,
				repeat: parseInt(todoMatchNew[4]),
			}

			if(todo.state === ' ') {
				todo.count = 0;
			} else {
				const parsedCount = Number(todo.state)
				if(isNaN(parsedCount)) {
					return;
				}
				todo.count = parsedCount;
			}


			todo.count+=1;

			if(todo.count >= todo.repeat) {
				todo.state = 'x'
			} else {
				todo.state = (todo.count).toString();
			}

			setTimeout(async () => {
				line.setAttribute('data-task', todo.state)
				line.addClass('is-checked');
				target.checked = true;
				
				contentAfterChangeLines[lineIndex] = `${todo.indent}- [${todo.state}] ${todo.text}`;

				let newContent = contentAfterChangeLines.join('\n');

				this.app.vault.modify(currentFile, newContent);
			}, 100);
	
			return false;
		});

		this.registerEvent(
			this.app.workspace.on('editor-change', (editor: Editor, info: MarkdownView | MarkdownFileInfo) => {
				// Prevent multiple triggers due to change of editor inside this function
				if(this.lastTriggered + 100 > Date.now()) {
					return;
				}
				this.lastTriggered = Date.now();

				// Get the content of the editor before and after the change
				const contentAfterChange = editor.getValue();
				//@ts-ignore
				const contentBeforeChange = info.data;
				
				// Split the content into lines
				const contentBeforeChangeLines = contentBeforeChange.split('\n');
				const contentAfterChangeLines = contentAfterChange.split('\n');

				// Find the first line that changed
				let lineIndex = 0;
				for (;lineIndex < contentBeforeChangeLines.length; lineIndex++) {
					if(contentBeforeChangeLines[lineIndex]	!== contentAfterChangeLines[lineIndex]) {
						break;
					}
				}

				//No change detected
				if(lineIndex === contentBeforeChangeLines.length) {
					return;
				}

				// Get the the todo from the line
				const todoRegexOld = /^([^\S\r\n]*)- \[(.)] (.*#(\d).*)$/gm
				const todoRegexNew = /^([^\S\r\n]*)- \[(.)] (.*#(\d).*)$/gm

				const todoMatchOld = todoRegexOld.exec(contentBeforeChangeLines[lineIndex]);
				const todoMatchNew = todoRegexNew.exec(contentAfterChangeLines[lineIndex]);

				// No todo with repeat detected
				if(!todoMatchOld || !todoMatchNew) {
					return;
				}

				const oldTodo = {
					indent: todoMatchOld[1],
					state: todoMatchOld[2],
					text: todoMatchOld[3],
					count: -1,
					repeat: parseInt(todoMatchOld[4]),
				}

				const newTodo = {
					indent: todoMatchNew[1],
					state: todoMatchNew[2],
					text: todoMatchNew[3],
					count: -1,
					repeat: parseInt(todoMatchOld[4]),
				}

				// No change in todo state detected
				if(oldTodo.state === newTodo.state) {
					return;
				}

				if (oldTodo.state === ' ') {
					newTodo.count = 0;
				} else {
					const count = Number(oldTodo.state)
					if(isNaN(count)) {
						return;
					}
					newTodo.count = count;
				}

				// Increment Count and check if todo is done
				newTodo.count++;
				if(newTodo.count >= newTodo.repeat) {
					newTodo.state = 'x'
				} else {
					newTodo.state = (newTodo.count).toString();
				}

				editor.setLine(lineIndex, `${newTodo.indent}- [${newTodo.state}] ${newTodo.text}`);
			})
		  );

	}

	onunload() {}
}

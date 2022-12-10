/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import * as cowsay from 'cowsay';

export function activate({ subscriptions }: vscode.ExtensionContext) {
	// register a content provider for the cowsay-scheme
	const myScheme = 'cowsay';
	const myProvider = new (class implements vscode.TextDocumentContentProvider {
		// emitter and its event
		onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
		onDidChange = this.onDidChangeEmitter.event;

		provideTextDocumentContent(uri: vscode.Uri): string {
			// simply invoke cowsay, use uri-path as text
			console.log(cowsay.think({ text: 'mooooooo', eyes: 'XX' }));
			return cowsay.say({ text: uri.path, tongue: 'true', eyes: 'X' });
		}
	})();
	subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(myScheme, myProvider)
	);

	// register a command that opens a cowsay-document
	subscriptions.push(
		vscode.commands.registerCommand('cowsay.say', async () => {
			const what = await vscode.window.showInputBox({ placeHolder: 'cowsay...' });
			if (what) {
				const uri = vscode.Uri.parse('cowsay:' + what);
				const doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
				await vscode.window.showTextDocument(doc, { preview: false });
				console.log(cowsay.think({ text: 'mooooooo', eyes: 'XX' }));
			}
		})
	);

	subscriptions.push(
		vscode.workspace.onWillSaveTextDocument(() => {
			console.log('registering will save');
			return vscode.commands.registerCommand('cowsay.willSave', () => {
				console.log('willSave');
			});
		})
	);
	subscriptions.push(
		vscode.workspace.onWillSaveTextDocument(() => {
			console.log('registering did save');
			return vscode.commands.registerCommand('cowsay.didSave', () => {
				console.log('didSave');
			});
		})
	);
	// register a command that updates the current cowsay
	subscriptions.push(
		vscode.commands.registerCommand('cowsay.backwards', async () => {
			if (!vscode.window.activeTextEditor) {
				return; // no editor
			}
			const { document } = vscode.window.activeTextEditor;
			if (document.uri.scheme !== myScheme) {
				return; // not my scheme
			}
			console.log('attempting save', await document.save());
			// get path-components, reverse it, and create a new uri
			const say = document.uri.path;
			const newSay = say.split('').reverse().join('');
			const newUri = document.uri.with({ path: newSay });
			vscode.commands.executeCommand('cowsay.willSave');

			await vscode.window.showTextDocument(newUri, { preview: true });
		})
	);
}

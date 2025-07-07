// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
// import * as lua from 'lua-in-js';
// import { Crc32 } from './crc32';
import crc32 from 'crc32-ts';
// import("crc32-ts");c

// const luaEnv = lua.createEnv();

const DEFINE_STRING = "define ";
const ALIAS_STRING = "alias ";
const LINE_LENGTH = 52;
const FILE_PREFIX = "compiled_";
const HASH_STRING = "HASH(";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ic10compiler" is now active!');

	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// const disposable = vscode.commands.registerCommand('ic10compiler.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World from IC10Compiler!');
	// });

	const disposable = vscode.commands.registerCommand('ic10compiler.compile', async() => {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;
		
		if (editor) {
            // Get the URI of the current file
            const uri = editor.document.uri;
            
            try {
                // Read the contents of the file
                const content = await vscode.workspace.fs.readFile(uri);
                
                // Modify the string to replace defines and aliases
                let fileString = Buffer.from(content).toString();
				fileString = replace(fileString, DEFINE_STRING);
				fileString = replace(fileString, ALIAS_STRING);

				// Save to new file
				let fileName = path.basename(uri.fsPath);
				fileName = FILE_PREFIX+fileName;
				let targetDir = path.dirname(uri.fsPath)+"/";
				let newPath = path.join(targetDir+fileName);

				// vscode.window.showInformationMessage(`targetDir: ${targetDir}\nuriFSPath: ${uri.fsPath}\nnewPath: ${newPath}`);

				try {
					fs.writeFileSync(newPath, fileString);
				} catch(error) {
					vscode.window.showErrorMessage(`Failed to write file: ${(error as Error).message}`);
				} finally {
					vscode.window.showInformationMessage(`File compiled to ${newPath}`);
				}
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to read file: ${(error as Error).message}`);
            }
        } else {
            vscode.window.showInformationMessage('No active text editor.');
        }
	});
	context.subscriptions.push(disposable);
}

function replace(str:string, directive:string):string {
	let pos:number = str.indexOf(directive);
	while(pos >= 0) {
		let nameEnd:number = str.indexOf(" ", pos + directive.length);
		let name:string = " " + str.substring(pos+directive.length, nameEnd) + " ";
		name = name.trim();
		let contentEnd:number = str.indexOf("\n", nameEnd+1);
		let content:string = str.substring(nameEnd, contentEnd) + " ";
		content = content.trim();
		content = removeComment(content);
		content = replaceHash(content);
		
		str = str.slice(0, pos) + str.slice(contentEnd+1);
		str = str.replaceAll(name, content);

		pos = str.indexOf(directive, pos);
	}
	return str;
}

function removeComment(str:string):string {
	let commentStart = str.indexOf("#");
	if(commentStart > 0) {
		return str.substring(0, commentStart);
	}
	return str;
}

function replaceHash(str:string):string {
	if(str.startsWith(HASH_STRING)) {
		let hashEnd:number = str.indexOf(")");
		let content:string = str.substring(HASH_STRING.length+1, hashEnd-1);
		// vscode.window.showInformationMessage(`Hashing ${content}`);
		return stationeersHash(content).toString();
	}
	return str;
}

function stationeersHash(str:string) {
	let buffer = Buffer.from(str);
	return crc32(buffer);
}

// This method is called when your extension is deactivated
export function deactivate() {}

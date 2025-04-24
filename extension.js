const vscode = require('vscode');

function activate(context) {
	// This line of code will only be executed once when your extension is activated
	console.log('The extension "code-collapser" is now active!');
    let disposable = vscode.commands.registerCommand('extension.collapseBlock', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            return;
        }

        const document = editor.document;
        const position = editor.selection.active;
        const line = document.lineAt(position.line);
        const text = line.text;
        const cursorPos = position.character;

        // Buscar el carácter de apertura más cercano a la izquierda del cursor
        const openChars = ['(', '[', '{'];
        let openChar = null;
        let openPos = -1;

        for (let i = cursorPos - 1; i >= 0; i--) {
            if (openChars.includes(text[i])) {
                openChar = text[i];
                openPos = i;
                break;
            }
        }

        if (!openChar) {
            vscode.window.showInformationMessage('No opening bracket found to the left of cursor');
            return;
        }

        // Encontrar el carácter de cierre correspondiente
        const closeChar = {
            '(': ')',
            '[': ']',
            '{': '}'
        }[openChar];

        let depth = 1;
        let closeLine = line.lineNumber;
        let closePos = -1;
        let found = false;

        // Buscar desde la posición actual hacia adelante
        outer: for (let i = line.lineNumber; i < document.lineCount; i++) {
            const currentLine = document.lineAt(i);
            const lineText = currentLine.text;
            const startPos = (i === line.lineNumber) ? openPos + 1 : 0;

            for (let j = startPos; j < lineText.length; j++) {
                if (lineText[j] === openChar) {
                    depth++;
                } else if (lineText[j] === closeChar) {
                    depth--;
                    if (depth === 0) {
                        closeLine = i;
                        closePos = j;
                        found = true;
                        break outer;
                    }
                }
            }
        }

        if (!found) {
            vscode.window.showErrorMessage('Matching closing bracket not found!');
            return;
        }

        // Crear el rango para colapsar
        const start = new vscode.Position(line.lineNumber, openPos);
        const end = new vscode.Position(closeLine, closePos + 1);
        const range = new vscode.Range(start, end);

        // Ejecutar comando para colapsar
        vscode.commands.executeCommand('editor.fold', {
            levels: 1,
            direction: 'down',
            selectionLines: [line.lineNumber],
            up: false,
            to: 'position',
            position: {
                lineNumber: closeLine,
                column: closePos + 1
            }
        }).then(() => {
            // Mover el cursor al inicio del bloque colapsado
            const newPosition = new vscode.Position(line.lineNumber, openPos + 1);
            editor.selection = new vscode.Selection(newPosition, newPosition);
        });
    });

    context.subscriptions.push(disposable);
}

// verificar si hay recursos o elemento/s q deberìa liberar, (o tb archivos abiertos)
function deactivate() {}

module.exports = {
    activate,
    deactivate
};
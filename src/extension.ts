import * as vscode from "vscode";
import { PhpCsFixerRunner } from "./phpCsFixerRunner";
import { DiagnosticsProvider } from "./diagnosticsProvider";
import { FormatterProvider } from "./formatterProvider";

let diagnosticsProvider: DiagnosticsProvider | null = null;
let runner: PhpCsFixerRunner | null = null;

export function activate(context: vscode.ExtensionContext) {
  console.log("Advanced php-cs-fixer extension is now active");

  runner = new PhpCsFixerRunner();
  diagnosticsProvider = new DiagnosticsProvider(runner);
  const formatterProvider = new FormatterProvider(runner);

  diagnosticsProvider.activate(context);

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      "php",
      formatterProvider
    )
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("advancedPhpCsFixer")) {
        runner?.updateConfig();
        vscode.window.showInformationMessage(
          "php-cs-fixer configuration updated"
        );
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("advancedPhpCsFixer.fix", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      if (editor.document.languageId !== "php") {
        vscode.window.showErrorMessage(
          "This command only works with PHP files"
        );

        return;
      }

      try {
        await vscode.commands.executeCommand("editor.action.formatDocument");
        vscode.window.showInformationMessage(
          "php-cs-fixer applied successfully"
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "advancedPhpCsFixer.checkFile",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }

        if (editor.document.languageId !== "php") {
          vscode.window.showErrorMessage(
            "This command only works with PHP files"
          );

          return;
        }

        try {
          const result = await runner?.checkFile(editor.document.uri.fsPath);
          if (result?.issues && result.issues.length > 0) {
            vscode.window.showInformationMessage(
              `Found ${result.issues.length} code style issue(s)`
            );
          } else {
            vscode.window.showInformationMessage("No code style issues found");
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
      }
    )
  );
}

export function deactivate() {
  if (diagnosticsProvider) {
    diagnosticsProvider.dispose();
    diagnosticsProvider = null;
  }
  runner = null;
}

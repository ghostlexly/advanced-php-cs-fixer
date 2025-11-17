import * as vscode from "vscode";
import * as fs from "fs";
import { promisify } from "util";
import { PhpCsFixerRunner } from "./phpCsFixerRunner";

const readFileAsync = promisify(fs.readFile);

export class FormatterProvider
  implements vscode.DocumentFormattingEditProvider
{
  private runner: PhpCsFixerRunner;

  constructor(runner: PhpCsFixerRunner) {
    this.runner = runner;
  }

  public async provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): Promise<vscode.TextEdit[]> {
    const config = vscode.workspace.getConfiguration("advancedPhpCsFixer");
    const enableFormatting = config.get<boolean>("enableFormatting", true);

    if (!enableFormatting) {
      return [];
    }

    if (document.uri.scheme !== "file") {
      vscode.window.showErrorMessage(
        "php-cs-fixer can only format files on disk"
      );

      return [];
    }

    try {
      await document.save();

      const originalContent = document.getText();
      const result = await this.runner.fixFile(document.uri.fsPath);

      if (!result.success) {
        vscode.window.showErrorMessage(`php-cs-fixer error: ${result.output}`);

        return [];
      }

      const fixedContent = await readFileAsync(document.uri.fsPath, "utf8");

      if (fixedContent === originalContent) {
        return [];
      }

      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(originalContent.length)
      );

      return [vscode.TextEdit.replace(fullRange, fixedContent)];
    } catch (error: any) {
      vscode.window.showErrorMessage(`php-cs-fixer error: ${error.message}`);

      return [];
    }
  }
}

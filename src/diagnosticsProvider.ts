import * as vscode from "vscode";
import { PhpCsFixerRunner } from "./phpCsFixerRunner";

export class DiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private runner: PhpCsFixerRunner;
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceDelay = 1000;

  constructor(runner: PhpCsFixerRunner) {
    this.runner = runner;
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection("php-cs-fixer");
  }

  public activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(this.diagnosticCollection);

    context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument((document) => {
        this.checkDocument(document);
      })
    );

    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        this.debouncedCheck(event.document);
      })
    );

    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        this.checkDocument(document);
      })
    );

    context.subscriptions.push(
      vscode.workspace.onDidCloseTextDocument((document) => {
        this.diagnosticCollection.delete(document.uri);
      })
    );

    vscode.workspace.textDocuments.forEach((document) => {
      this.checkDocument(document);
    });
  }

  private debouncedCheck(document: vscode.TextDocument): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.checkDocument(document);
    }, this.debounceDelay);
  }

  private async checkDocument(document: vscode.TextDocument): Promise<void> {
    const config = vscode.workspace.getConfiguration("advancedPhpCsFixer");
    const enableDiagnostics = config.get<boolean>("enableDiagnostics", true);

    if (!enableDiagnostics) {
      return;
    }

    if (document.languageId !== "php") {
      return;
    }

    if (document.uri.scheme !== "file") {
      return;
    }

    try {
      const result = await this.runner.checkFile(document.uri.fsPath);

      if (result.issues && result.issues.length > 0) {
        const diagnostics = result.issues.map((issue) => {
          const line = Math.max(0, issue.line - 1);
          const range = new vscode.Range(
            new vscode.Position(line, issue.column),
            new vscode.Position(line, Number.MAX_SAFE_INTEGER)
          );

          const severity =
            issue.severity === "error"
              ? vscode.DiagnosticSeverity.Error
              : vscode.DiagnosticSeverity.Warning;

          const diagnostic = new vscode.Diagnostic(
            range,
            issue.message,
            severity
          );

          diagnostic.source = "advanced-php-cs-fixer";
          if (issue.rule) {
            diagnostic.code = issue.rule;
          }

          return diagnostic;
        });

        this.diagnosticCollection.set(document.uri, diagnostics);
      } else {
        this.diagnosticCollection.delete(document.uri);
      }
    } catch (error) {
      console.error("Error checking document:", error);
    }
  }

  public dispose(): void {
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

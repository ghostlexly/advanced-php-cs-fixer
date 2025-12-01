import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

export interface PhpCsFixerResult {
  success: boolean;
  output: string;
  fixedContent?: string;
  issues?: PhpCsFixerIssue[];
}

export interface PhpCsFixerIssue {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
  rule?: string;
}

export class PhpCsFixerRunner {
  private config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration("advancedPhpCsFixer");
  }

  public updateConfig(): void {
    this.config = vscode.workspace.getConfiguration("advancedPhpCsFixer");
  }

  private getExecutablePath(): string {
    const executablePath = this.config.get<string>(
      "executablePath",
      "php-cs-fixer"
    );

    return executablePath;
  }

  private getConfigPath(): string {
    const configPath = this.config.get<string>("configPath", "");
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
      return configPath;
    }

    const workspaceFolder = workspaceFolders[0].uri.fsPath;

    if (configPath) {
      return configPath.replace(/\$\{workspaceFolder\}/g, workspaceFolder);
    }

    const configFiles = [
      ".php-cs-fixer.php",
      ".php-cs-fixer.dist.php",
      ".php-cs.php",
      ".php-cs.dist.php",
    ];

    for (const configFile of configFiles) {
      const fullPath = path.join(workspaceFolder, configFile);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    return "";
  }

  private getAllowRisky(): boolean {
    const allowRisky = this.config.get<boolean>("allowRisky", false);

    return allowRisky;
  }

  private buildCommand(filePath: string, dryRun: boolean = false): string {
    const executable = this.getExecutablePath();
    const configPath = this.getConfigPath();
    const allowRisky = this.getAllowRisky();

    let command = `${executable} fix "${filePath}"`;

    if (dryRun) {
      command += " --dry-run --diff --verbose";
    }

    if (configPath) {
      command += ` --config="${configPath}"`;
    }

    if (allowRisky) {
      command += " --allow-risky=yes";
    }

    command += " --format=json";

    return command;
  }

  public async checkFile(filePath: string): Promise<PhpCsFixerResult> {
    try {
      const command = this.buildCommand(filePath, true);
      const { stdout, stderr } = await execAsync(command);

      const issues = this.parseOutput(stdout);

      return {
        success: true,
        output: stdout,
        issues,
      };
    } catch (error: any) {
      const output = error.stdout || error.stderr || error.message;
      const issues = this.parseOutput(output);

      return {
        success: false,
        output,
        issues,
      };
    }
  }

  public async fixFile(filePath: string): Promise<PhpCsFixerResult> {
    try {
      const command = this.buildCommand(filePath, false);
      const { stdout, stderr } = await execAsync(command);

      return {
        success: true,
        output: stdout,
      };
    } catch (error: any) {
      const output = error.stdout || error.stderr || error.message;

      const isActualSuccess = this.isSuccessOutput(output);

      return {
        success: isActualSuccess,
        output,
      };
    }
  }

  private isSuccessOutput(output: string): boolean {
    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return false;
      }

      const result = JSON.parse(jsonMatch[0]);

      return result.files !== undefined || result.time !== undefined;
    } catch (error) {
      return false;
    }
  }

  private parseOutput(output: string): PhpCsFixerIssue[] {
    const issues: PhpCsFixerIssue[] = [];

    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return issues;
      }

      const result = JSON.parse(jsonMatch[0]);

      if (result.files && Array.isArray(result.files)) {
        result.files.forEach((file: any) => {
          if (file.diff) {
            const appliedFixers = file.appliedFixers || [];
            const diffIssues = this.parseDiff(file.diff, appliedFixers);
            issues.push(...diffIssues);
          }
        });
      }
    } catch (error) {
      console.error("Failed to parse php-cs-fixer output:", error);
    }

    return issues;
  }

  private parseDiff(diff: string, appliedFixers: string[]): PhpCsFixerIssue[] {
    const issues: PhpCsFixerIssue[] = [];
    const lines = diff.split("\n");
    let currentLine = 0;

    const rulesText =
      appliedFixers.length > 0 ? appliedFixers.join(", ") : "code_style";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineMatch = line.match(/^@@ -(\d+),?\d* \+(\d+),?\d* @@/);

      if (lineMatch) {
        currentLine = parseInt(lineMatch[1], 10);
        continue;
      }

      if (line.startsWith("-") && !line.startsWith("---")) {
        const message = `php-cs-fixer: ${rulesText}`;
        const rule = appliedFixers.length > 0 ? appliedFixers[0] : undefined;

        issues.push({
          line: currentLine,
          column: 0,
          message,
          severity: "warning",
          rule,
        });
      }

      if (!line.startsWith("+")) {
        currentLine++;
      }
    }

    return issues;
  }
}

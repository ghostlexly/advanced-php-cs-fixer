# Advanced php-cs-fixer

A Visual Studio Code extension that provides real-time diagnostics and formatting for PHP files using php-cs-fixer.

## Features

- **Real-time Diagnostics**: Display php-cs-fixer errors and warnings directly in your code as you type
- **Auto-formatting**: Format your PHP files using php-cs-fixer when you save or manually format
- **Configurable**: Customize php-cs-fixer settings through VS Code settings
- **Commands**: Manual commands to check or fix individual files

## Requirements

- [php-cs-fixer](https://github.com/PHP-CS-Fixer/PHP-CS-Fixer) must be installed and accessible
- PHP must be installed on your system

### Installing php-cs-fixer

You can install php-cs-fixer globally using composer:

```bash
composer global require friendsofphp/php-cs-fixer
```

Or install it locally in your project:

```bash
composer require --dev friendsofphp/php-cs-fixer
```

## Extension Settings

This extension contributes the following settings:

- `advancedPhpCsFixer.executablePath`: Path to php-cs-fixer executable (default: `php-cs-fixer`)
- `advancedPhpCsFixer.configPath`: Path to .php-cs-fixer.php config file (optional)
- `advancedPhpCsFixer.enableDiagnostics`: Enable/disable diagnostics (default: `true`)
- `advancedPhpCsFixer.enableFormatting`: Enable/disable formatting (default: `true`)
- `advancedPhpCsFixer.allowRisky`: Allow risky rules (default: `false`)
- `advancedPhpCsFixer.rules`: Custom php-cs-fixer rules (overrides config file)

### Example Configuration

Add this to your VS Code settings.json:

```json
{
  "advancedPhpCsFixer.executablePath": "vendor/bin/php-cs-fixer",
  "advancedPhpCsFixer.configPath": "${workspaceFolder}/.php-cs-fixer.php",
  "advancedPhpCsFixer.enableDiagnostics": true,
  "advancedPhpCsFixer.enableFormatting": true,
  "advancedPhpCsFixer.allowRisky": true
}
```

## Commands

The extension provides the following commands:

- `PHP CS Fixer: Fix Current File`: Apply php-cs-fixer to the current PHP file
- `PHP CS Fixer: Check Current File`: Check the current file for code style issues

You can access these commands through the Command Palette (Cmd+Shift+P on macOS or Ctrl+Shift+P on Windows/Linux).

## Usage

### Diagnostics (Linting)

Once the extension is installed and configured:

1. Open any PHP file
2. The extension will automatically analyze your code
3. Errors and warnings will appear as squiggly lines in your editor
4. Hover over them to see details about the code style issues

### Formatting

To format a PHP file:

1. Open a PHP file
2. Use the format document command:
   - macOS: `Shift+Option+F`
   - Windows/Linux: `Shift+Alt+F`
3. Or right-click and select "Format Document"
4. The extension will apply php-cs-fixer fixes to your file

You can also enable format on save by adding this to your settings:

```json
{
  "[php]": {
    "editor.defaultFormatter": "ghostlexly.advanced-php-cs-fixer",
    "editor.formatOnSave": true
  }
}
```

## Configuration File

You can create a `.php-cs-fixer.php` file in your project root to configure php-cs-fixer rules:

```php
<?php

$config = new PhpCsFixer\Config();

return $config
    ->setRules([
        '@PSR12' => true,
        'array_syntax' => ['syntax' => 'short'],
        'ordered_imports' => ['sort_algorithm' => 'alpha'],
        'no_unused_imports' => true,
    ])
    ->setFinder(
        PhpCsFixer\Finder::create()
            ->in(__DIR__)
            ->exclude('vendor')
    );
```

Then reference it in your VS Code settings:

```json
{
  "advancedPhpCsFixer.configPath": "${workspaceFolder}/.php-cs-fixer.php"
}
```

## Troubleshooting

### Extension Not Working

1. Verify that php-cs-fixer is installed:

   ```bash
   php-cs-fixer --version
   ```

2. Check the executable path in your settings:

   - If installed globally: `php-cs-fixer`
   - If installed locally: `vendor/bin/php-cs-fixer`

3. Check the VS Code Output panel:
   - Open View > Output
   - Select "Advanced php-cs-fixer" from the dropdown

### Diagnostics Not Showing

- Ensure `advancedPhpCsFixer.enableDiagnostics` is set to `true`
- Check that the file is saved (diagnostics work best on saved files)
- Verify your php-cs-fixer configuration is correct

### Formatting Not Working

- Ensure `advancedPhpCsFixer.enableFormatting` is set to `true`
- Make sure the file is saved before formatting
- Check that you have write permissions to the file

## Known Issues

- The extension requires files to be saved to disk before formatting
- Large files may take a moment to analyze
- Some php-cs-fixer rules may not show detailed diagnostics

## Release Notes

### 1.0.0

Initial release:

- Real-time diagnostics for php-cs-fixer
- Document formatting support
- Configurable settings
- Manual fix and check commands

## Contributing

Found a bug or have a feature request? Please open an issue on the GitHub repository.

## License

MIT

# Cursor AI Rules Installer

A command-line interface tool for installing and managing Cursor AI rules in your projects.

## Features

- Initialize AI rules in your project
- Update existing AI rules to their latest versions
- Interactive rule selection
- YAML-based configuration
- Git integration for rule management

## Installation

```bash
# Clone the repository
git clone git@github.com:Multiverse-io/cari.git
cd cari

# Install dependencies
yarn install
```

## Development

```bash
# Run in development mode
yarn dev
yarn dev init # Run the init command
yarn dev update # Run the update command

# Build the project
yarn build

# Run the built version
yarn start
```

## Global Installation

To install the CLI globally on your system:

```bash
# Build the project first
yarn build

# Install globally using npm
npm install -g .

# Now you can run the command from anywhere
cari
```

## Usage

### Initialize AI Rules

Initialize AI rules in your project:

```bash
cari init
```

This command will:
1. Clone the AI rules repository if it doesn't exist
2. Find all available rule files
3. Allow you to select which rules to include
4. Create a configuration file (.ari.yaml)
5. Copy the selected rule files to your project

### Update AI Rules

Update the AI rules in your project:

```bash
cari update
```

This command will:
1. Pull the latest changes from the AI rules repository
2. Check your configuration file (.ari.yaml) for included rules
3. Copy the latest version of those rules to your project

## Requirements

- Node.js >= 14.0.0
- Yarn >= 4.1.1 (recommended package manager)

## Development

### Testing

```bash
# Run tests once
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

### Project Structure

```
cursor-ai-rules-installer/
├── src/
│   ├── commands/     # CLI commands implementation
│   └── index.ts      # Main CLI entry point
├── dist/            # Compiled JavaScript files
├── package.json     # Project configuration
└── README.md        # This file
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Author

Tim Gent

## Support

For support, please open an issue in the [GitHub repository](https://github.com/Multiverse-io/cari).

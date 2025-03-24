# Cursor AI Rules Installer

A command-line interface tool for installing and managing Cursor AI rules in your projects.

## Features

- Initialize AI rules in your project
- Update existing AI rules to their latest versions
- Interactive rule selection
- YAML-based configuration
- Git integration for rule management

## Installation

We recommend adding it to your project:

Yarn:

```bash
yarn add -D @multiverse-io/cari
```

npm: 

```bash
npm install --dev @multiverse-io/cari
```

If you like you can install globally with:

```bash
npm install -g @multiverse-io/cari
```

### Initialize AI Rules

Initialize AI rules in your project:

```bash
yarn run cari init # Or `cari init` if installed globally
```

This command will:
1. Clone the AI rules repository in `~/.cari` if it doesn't exist
2. Find all available rule files
3. Allow you to select which rules to include
4. Create a configuration file (.cari.yaml) in your project
5. Copy the selected rule files to your project

### Update AI Rules

Update the AI rules in your project:

```bash
yarn run cari update # Or `cari update` if installed globally
```

This command will:
1. Pull the latest changes from the AI rules repository
2. Check your configuration file (.cari.yaml) for included rules
3. Copy the latest version of those rules to your project
4. Ask if you want to include any new central rules it finds

## For Contributors

### Requirements

- Node.js >= 14.0.0
- Yarn >= 4.1.1 (recommended package manager)

### Initial setup

```bash
# Clone the repository
git clone git@github.com:Multiverse-io/cari.git
cd cari

# Install dependencies
yarn install
```

### Development

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

### Testing

```bash
# Run tests once
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

## Author

Tim Gent

## Support

For support, please open an issue in the [GitHub repository](https://github.com/Multiverse-io/cari).

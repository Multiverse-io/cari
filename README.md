# Cursor AI Rules Installer

A command-line interface tool for installing and managing Cursor AI rules in your projects.

## Features

- Initialize AI rules in your project
- Update existing AI rules to their latest versions
- Interactive rule selection
- YAML-based configuration
- Git integration for rule management

## Installation

We recommend installing globally:

```bash
npm install -g @multiverse-io/cari
```

## The structure of an AI Rules repository

- Cari works by taking rules from your central AI Rules repository and installing them to your project
- The only requirement for a central rules repository is that it contains a top-level `rules` directory
- Within the rules directory you should have your `*.mdc` rules files
- These files can be nested within folders to help you organise them by category

### Initialize AI Rules

Initialize AI rules in your project:

Yarn:

```bash
cari init
```

This command will:

1. Clone the AI rules repository(s) in `~/.cari` if it doesn't exist
2. Find all available rule files
3. Allow you to select which rules to include
4. Create a configuration file (.cari.yaml) in your project
5. Copy the selected rule files to your project

### Update AI Rules

Update the AI rules in your project:

Yarn:

```bash
cari update
```

This command will:

1. Pull the latest changes from the AI rules repository
2. Check your configuration file (.cari.yaml) for included rules
3. Copy the latest version of those rules to your project
4. Ask if you want to include any new central rules it finds

## For Contributors

### Requirements

- Node.js >= 14.0.0
- Yarn >= 4.1.1

### Initial setup

```bash
# Clone the repository
git clone git@github.com:Multiverse-io/cari.git
cd cari
yarn install
```

### Development

```bash
# Run in development mode
yarn dev
yarn dev init 
yarn dev update 

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

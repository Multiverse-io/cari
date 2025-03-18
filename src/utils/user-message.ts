import chalk from "chalk";

export const happyMessage = (message: string) => {
  console.log(chalk.green.bold(message));
};

export const warningMessage = (message: string) => {
  console.log(chalk.yellow.bold(message));
};

export const errorMessage = (message: string) => {
  console.log(chalk.red.bold(message));
};

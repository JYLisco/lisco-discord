import fs from 'fs';
import path from 'path';
import { Console } from 'console';
import { CustomStrings } from '../../constants/strings';

export enum Loggers {
  App = 'app',
  Api = 'api',
}

export class AppLogger {
  private static instance: AppLogger;
  private consoleLogger: Console;
  private appLogger: fs.WriteStream;
  private apiLogger: fs.WriteStream;

  private constructor() {
    this.consoleLogger = new Console(process.stdout, process.stderr);
    const projectRootPath = AppLogger.getProjectRootPath();

    const logFilePath = path.join(projectRootPath, 'var/log', 'app.log');
    const apiLogFilePath = path.join(projectRootPath, 'var/log', 'api.log');
    this.appLogger = fs.createWriteStream(logFilePath, { flags: 'a' });
    this.apiLogger = fs.createWriteStream(apiLogFilePath, { flags: 'a' });
  }

  private static getProjectRootPath(): string {
    const mainModulePath = require.main?.filename ?? '';
    const cwd = process.cwd();
    // If mainModulePath begins with cwd, assume it's relative to the cwd
    return mainModulePath.startsWith(cwd) ? cwd : path.dirname(mainModulePath);
  }

  static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }
    return AppLogger.instance;
  }

  private logToConsole(
    logger: Loggers,
    methodName: keyof Console,
    ...args: unknown[]
  ): void {
    // Cast consoleLogger to any to avoid TypeScript errors with apply
    if (logger === 'app') {
      (this.consoleLogger as any)[methodName].apply(this.consoleLogger, args);
    }
  }

  private logToFile(
    logger: Loggers,
    logLevel: string,
    ...args: unknown[]
  ): void {
    // Format the message with the current time in ISO format and the log level
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${logLevel}] ${args.join(' ')}\n`;

    if (logger === 'app') {
      this.appLogger.write(formattedMessage);
    } else {
      this.apiLogger.write(`\nResponse ${CustomStrings.Divider}\n`);
      this.apiLogger.write(formattedMessage);
      this.apiLogger.write(`End Response ${CustomStrings.Divider}`);
    }

    // Write the formatted message to the log file
  }

  debug(logger: Loggers, ...args: unknown[]): void {
    this.logToConsole(logger, 'debug', ...args);
    this.logToFile(logger, 'DEBUG', ...args);
  }

  info(logger: Loggers, ...args: unknown[]): void {
    this.logToConsole(logger, 'info', ...args);
    this.logToFile(logger, 'INFO', ...args);
  }

  warn(logger: Loggers, ...args: unknown[]): void {
    this.logToConsole(logger, 'warn', ...args);
    this.logToFile(logger, 'WARN', ...args);
  }

  error(logger: Loggers, ...args: unknown[]): void {
    this.logToConsole(logger, 'error', ...args);
    this.logToFile(logger, 'ERROR', ...args);
  }
}

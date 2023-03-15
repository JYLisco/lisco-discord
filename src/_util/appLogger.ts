import fs from 'fs';
import path from 'path';
import { Console } from 'console';

export class AppLogger {
  private static instance: AppLogger;
  private consoleLogger: Console;
  private fileLogger: fs.WriteStream;
  private logFilePath: string;

  private constructor() {
    this.consoleLogger = new Console(process.stdout, process.stderr);

    const projectRootPath = AppLogger.getProjectRootPath();
    this.logFilePath = path.join(projectRootPath, 'var/log', 'app.log');

    this.fileLogger = fs.createWriteStream(this.logFilePath, { flags: 'a' });
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

  private logToConsole(methodName: keyof Console, ...args: unknown[]): void {
    // Cast consoleLogger to any to avoid TypeScript errors with apply
    (this.consoleLogger as any)[methodName].apply(this.consoleLogger, args);
  }

  private logToFile(logLevel: string, ...args: unknown[]): void {
    // Format the message with the current time in ISO format and the log level
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${logLevel}] ${args.join(' ')}\n`;

    // Write the formatted message to the log file
    this.fileLogger.write(formattedMessage);
  }

  debug(...args: unknown[]): void {
    this.logToConsole('debug', ...args);
    this.logToFile('DEBUG', ...args);
  }

  info(...args: unknown[]): void {
    this.logToConsole('info', ...args);
    this.logToFile('INFO', ...args);
  }

  warn(...args: unknown[]): void {
    this.logToConsole('warn', ...args);
    this.logToFile('WARN', ...args);
  }

  error(...args: unknown[]): void {
    this.logToConsole('error', ...args);
    this.logToFile('ERROR', ...args);
  }
}

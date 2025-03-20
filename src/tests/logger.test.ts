import * as logger from '../utils/logger';

describe('Logger', () => {
  // Mock console.log
  const originalConsoleLog = console.log;
  const mockConsoleLog = jest.fn();
  
  beforeEach(() => {
    console.log = mockConsoleLog;
    mockConsoleLog.mockClear();
  });
  
  afterAll(() => {
    console.log = originalConsoleLog;
  });
  
  test('setLogLevel should affect which logs are output', () => {
    // Set to debug level and check all log types appear
    logger.setLogLevel(logger.LogLevel.DEBUG);
    
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');
    
    expect(mockConsoleLog).toHaveBeenCalledTimes(4);
    
    mockConsoleLog.mockClear();
    
    // Set to error level and check only errors appear
    logger.setLogLevel(logger.LogLevel.ERROR);
    
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');
    
    expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
  });
  
  test('error logger should include error category', () => {
    logger.setLogLevel(logger.LogLevel.ERROR);
    
    logger.error('Test error', logger.ErrorCategory.FILE_ACCESS);
    
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('FILE_ACCESS'));
  });
  
  test('error logger should include stack trace in debug mode', () => {
    logger.setLogLevel(logger.LogLevel.DEBUG);
    
    const testError = new Error('Test error');
    logger.error('Error message', logger.ErrorCategory.UNKNOWN, testError);
    
    // First call for the error message
    expect(mockConsoleLog).toHaveBeenCalledTimes(2);
    // Second call for the stack trace
    expect(mockConsoleLog.mock.calls[1][0]).toContain('Error: Test error');
  });
  
  test('safeOperation should catch errors and return default value', () => {
    logger.setLogLevel(logger.LogLevel.ERROR);
    
    const throwingFn = () => {
      throw new Error('Test error');
    };
    
    const result = logger.safeOperation(
      throwingFn,
      'Operation failed',
      logger.ErrorCategory.UNKNOWN,
      'default value'
    );
    
    expect(result).toBe('default value');
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Operation failed'));
  });
  
  test('safeAsync should catch async errors and return default value', async () => {
    logger.setLogLevel(logger.LogLevel.ERROR);
    
    const throwingAsyncFn = async () => {
      throw new Error('Async test error');
    };
    
    const result = await logger.safeAsync(
      throwingAsyncFn,
      'Async operation failed',
      logger.ErrorCategory.NETWORK,
      'default async value'
    );
    
    expect(result).toBe('default async value');
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('NETWORK'));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Async operation failed'));
  });
}); 
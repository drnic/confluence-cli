const fs = require('fs');
const path = require('path');
const os = require('os');
const { getConfig } = require('../lib/config');

// Mock the config file location
const CONFIG_DIR = path.join(os.homedir(), '.confluence-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

describe('Config', () => {
  let originalEnv;
  let mockConfigExists;
  let mockConfigData;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };

    // Clear environment variables
    delete process.env.CONFLUENCE_DOMAIN;
    delete process.env.CONFLUENCE_API_TOKEN;
    delete process.env.CONFLUENCE_EMAIL;
    delete process.env.CONFLUENCE_AUTH_TYPE;
    delete process.env.CONFLUENCE_API_PATH;
    delete process.env.CONFLUENCE_DEFAULT_FORMAT;

    // Mock fs functions
    mockConfigExists = false;
    mockConfigData = null;

    jest.spyOn(fs, 'existsSync').mockImplementation((path) => {
      if (path === CONFIG_FILE) {
        return mockConfigExists;
      }
      return jest.requireActual('fs').existsSync(path);
    });

    jest.spyOn(fs, 'readFileSync').mockImplementation((path) => {
      if (path === CONFIG_FILE) {
        return JSON.stringify(mockConfigData);
      }
      return jest.requireActual('fs').readFileSync(path);
    });

    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('defaultFormat from environment', () => {
    test('uses defaultFormat from CONFLUENCE_DEFAULT_FORMAT env var', () => {
      process.env.CONFLUENCE_DOMAIN = 'test.atlassian.net';
      process.env.CONFLUENCE_API_TOKEN = 'test-token';
      process.env.CONFLUENCE_EMAIL = 'test@example.com';
      process.env.CONFLUENCE_DEFAULT_FORMAT = 'markdown';

      const config = getConfig();
      expect(config.defaultFormat).toBe('markdown');
    });

    test('validates defaultFormat from env var (html)', () => {
      process.env.CONFLUENCE_DOMAIN = 'test.atlassian.net';
      process.env.CONFLUENCE_API_TOKEN = 'test-token';
      process.env.CONFLUENCE_EMAIL = 'test@example.com';
      process.env.CONFLUENCE_DEFAULT_FORMAT = 'html';

      const config = getConfig();
      expect(config.defaultFormat).toBe('html');
    });

    test('defaults to text for invalid format from env var', () => {
      process.env.CONFLUENCE_DOMAIN = 'test.atlassian.net';
      process.env.CONFLUENCE_API_TOKEN = 'test-token';
      process.env.CONFLUENCE_EMAIL = 'test@example.com';
      process.env.CONFLUENCE_DEFAULT_FORMAT = 'invalid';

      const config = getConfig();
      expect(config.defaultFormat).toBe('text');
    });

    test('defaults to text when CONFLUENCE_DEFAULT_FORMAT is not set', () => {
      process.env.CONFLUENCE_DOMAIN = 'test.atlassian.net';
      process.env.CONFLUENCE_API_TOKEN = 'test-token';
      process.env.CONFLUENCE_EMAIL = 'test@example.com';

      const config = getConfig();
      expect(config.defaultFormat).toBe('text');
    });

    test('is case insensitive for format values', () => {
      process.env.CONFLUENCE_DOMAIN = 'test.atlassian.net';
      process.env.CONFLUENCE_API_TOKEN = 'test-token';
      process.env.CONFLUENCE_EMAIL = 'test@example.com';
      process.env.CONFLUENCE_DEFAULT_FORMAT = 'MARKDOWN';

      const config = getConfig();
      expect(config.defaultFormat).toBe('markdown');
    });
  });

  describe('defaultFormat from config file', () => {
    test('uses defaultFormat from config file', () => {
      mockConfigExists = true;
      mockConfigData = {
        domain: 'test.atlassian.net',
        token: 'test-token',
        email: 'test@example.com',
        authType: 'basic',
        apiPath: '/wiki/rest/api',
        defaultFormat: 'markdown'
      };

      const config = getConfig();
      expect(config.defaultFormat).toBe('markdown');
    });

    test('validates defaultFormat from config file', () => {
      mockConfigExists = true;
      mockConfigData = {
        domain: 'test.atlassian.net',
        token: 'test-token',
        email: 'test@example.com',
        authType: 'basic',
        apiPath: '/wiki/rest/api',
        defaultFormat: 'invalid'
      };

      const config = getConfig();
      expect(config.defaultFormat).toBe('text');
    });

    test('defaults to text when defaultFormat is missing from config file', () => {
      mockConfigExists = true;
      mockConfigData = {
        domain: 'test.atlassian.net',
        token: 'test-token',
        email: 'test@example.com',
        authType: 'basic',
        apiPath: '/wiki/rest/api'
      };

      const config = getConfig();
      expect(config.defaultFormat).toBe('text');
    });
  });
});

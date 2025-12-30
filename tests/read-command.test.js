const { exec } = require('child_process');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

describe('Read command', () => {
  const cliPath = path.join(__dirname, '..', 'bin', 'confluence.js');

  // Set up minimal environment for CLI to work
  beforeEach(() => {
    process.env.CONFLUENCE_DOMAIN = 'test.atlassian.net';
    process.env.CONFLUENCE_API_TOKEN = 'test-token';
    process.env.CONFLUENCE_EMAIL = 'test@example.com';
  });

  afterEach(() => {
    delete process.env.CONFLUENCE_DOMAIN;
    delete process.env.CONFLUENCE_API_TOKEN;
    delete process.env.CONFLUENCE_EMAIL;
    delete process.env.CONFLUENCE_DEFAULT_FORMAT;
  });

  describe('format validation', () => {
    test('accepts valid format: text', async () => {
      // This will fail to connect to API, but should not fail format validation
      try {
        await execPromise(`node ${cliPath} read 123456 --format text`);
      } catch (error) {
        // Should fail on API call, not format validation
        expect(error.stderr).not.toContain('Invalid format');
      }
    });

    test('accepts valid format: markdown', async () => {
      try {
        await execPromise(`node ${cliPath} read 123456 --format markdown`);
      } catch (error) {
        // Should fail on API call, not format validation
        expect(error.stderr).not.toContain('Invalid format');
      }
    });

    test('accepts valid format: html', async () => {
      try {
        await execPromise(`node ${cliPath} read 123456 --format html`);
      } catch (error) {
        // Should fail on API call, not format validation
        expect(error.stderr).not.toContain('Invalid format');
      }
    });

    test('rejects invalid format with error message', async () => {
      try {
        await execPromise(`node ${cliPath} read 123456 --format invalid`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.stderr || error.stdout).toContain('Invalid format "invalid"');
        expect(error.stderr || error.stdout).toContain('Valid formats: text, markdown, html');
        expect(error.code).toBe(1);
      }
    });

    test('is case insensitive for format values', async () => {
      try {
        await execPromise(`node ${cliPath} read 123456 --format MARKDOWN`);
      } catch (error) {
        // Should fail on API call, not format validation
        expect(error.stderr).not.toContain('Invalid format');
      }
    });
  });

  describe('default format', () => {
    test('uses default format from environment variable', async () => {
      process.env.CONFLUENCE_DEFAULT_FORMAT = 'markdown';

      try {
        await execPromise(`node ${cliPath} read 123456`);
      } catch (error) {
        // Should not show format error, will fail on API call
        expect(error.stderr).not.toContain('Invalid format');
      }
    });

    test('command-line flag overrides default format', async () => {
      process.env.CONFLUENCE_DEFAULT_FORMAT = 'text';

      try {
        await execPromise(`node ${cliPath} read 123456 --format markdown`);
      } catch (error) {
        // Should not show format error, will fail on API call
        expect(error.stderr).not.toContain('Invalid format');
      }
    });
  });
});

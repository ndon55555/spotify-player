'use client';

import { useState, useEffect, useRef } from 'react';

interface TokenTestButtonProps {
  refreshToken: () => Promise<string | undefined>;
}

interface TestResult {
  success?: boolean;
  message?: string;
  oldToken?: string;
  newToken?: string;
  timestamp?: number;
}

const TokenTestButton: React.FC<TokenTestButtonProps> = ({ refreshToken }) => {
  const [testResult, setTestResult] = useState<TestResult>({});
  const [loading, setLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Store test results in localStorage to persist them across rerenders
  useEffect(() => {
    // Check if we have stored results
    const storedResult = localStorage.getItem('tokenTestResult');
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult) as TestResult;
        // Only use stored results if they're recent (within last 30 seconds)
        if (parsedResult.timestamp && Date.now() - parsedResult.timestamp < 30000) {
          setTestResult(parsedResult);
        }
      } catch (e) {
        console.error('Error parsing stored test result', e);
      }
    }
  }, []);

  // Scroll to results when they change
  useEffect(() => {
    if (testResult.message && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [testResult]);

  // Function to manually test token refresh
  const testRefreshToken = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setTestResult({});

    try {
      console.log('Starting token refresh test...');

      // 1. Get the current token
      const tokenResponse = await fetch('/api/auth/token');
      const tokenData = await tokenResponse.json();
      const oldToken = tokenData.access_token;
      console.log('Got old token:', oldToken ? 'token present' : 'no token');

      // 2. Force a token refresh - use direct endpoint instead of the refreshToken function
      // This prevents any potential page refreshes that might be happening
      const refreshResponse = await fetch('/api/auth/refresh');
      const refreshData = await refreshResponse.json();
      console.log(
        'Refresh response:',
        refreshResponse.status,
        refreshData.access_token ? 'new token received' : 'no new token'
      );

      // 3. Get the new token after refresh
      const newTokenResponse = await fetch('/api/auth/token');
      const newTokenData = await newTokenResponse.json();
      const newToken = newTokenData.access_token;
      console.log('Got new token:', newToken ? 'token present' : 'no token');

      // 4. Compare the tokens
      const newResult: TestResult = {
        timestamp: Date.now(),
      };

      if (oldToken !== newToken) {
        newResult.success = true;
        newResult.message =
          'Token refresh successful! The new token is different from the old one.';
        newResult.oldToken = maskToken(oldToken);
        newResult.newToken = maskToken(newToken);
      } else {
        newResult.success = false;
        newResult.message =
          'Token refresh might have failed. The new token is identical to the old one.';
        newResult.oldToken = maskToken(oldToken);
        newResult.newToken = maskToken(newToken);
      }

      // Save result and also store it in localStorage
      setTestResult(newResult);
      localStorage.setItem('tokenTestResult', JSON.stringify(newResult));
    } catch (error) {
      console.error('Error during token refresh test:', error);
      const errorResult: TestResult = {
        success: false,
        message: `Error testing token refresh: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      setTestResult(errorResult);
      localStorage.setItem('tokenTestResult', JSON.stringify(errorResult));
    } finally {
      setLoading(false);
    }
  };

  // Helper function to mask the token for display
  const maskToken = (token?: string) => {
    if (!token) return 'No token';
    if (token.length <= 10) return token;
    return `${token.substring(0, 5)}...${token.substring(token.length - 5)}`;
  };

  // Clear test results
  const clearResults = () => {
    setTestResult({});
    localStorage.removeItem('tokenTestResult');
  };

  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-md relative">
      <h3 className="text-xl font-bold mb-3 text-white">Test Token Refresh</h3>
      <div className="flex space-x-3">
        <button
          onClick={testRefreshToken}
          disabled={loading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 font-medium"
        >
          {loading ? 'Testing...' : 'Test Refresh Token'}
        </button>

        {testResult.message && (
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
          >
            Clear Results
          </button>
        )}
      </div>

      {testResult.message && (
        <div
          ref={resultRef}
          className={`mt-6 p-5 rounded-lg border-2 ${testResult.success ? 'bg-green-900 border-green-500' : 'bg-red-900 border-red-500'}`}
        >
          <p className="text-lg font-bold mb-3">{testResult.success ? '✅ Success' : '❌ Issue'}</p>
          <p className="font-medium mb-3">{testResult.message}</p>
          {testResult.oldToken && (
            <div className="mt-3 p-3 bg-black bg-opacity-40 rounded border border-gray-700">
              <p className="font-mono text-sm mb-1">
                <span className="font-bold">Old Token:</span> {testResult.oldToken}
              </p>
              <p className="font-mono text-sm">
                <span className="font-bold">New Token:</span> {testResult.newToken}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TokenTestButton;

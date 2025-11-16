'use client';

export function logStartupInfo(): void {
  if (typeof window === 'undefined') return;

  const info = {
    'App': 'MULTIPLY Blockchain Game',
    'Version': '1.0.0',
    'Network': process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet',
    'Environment': process.env.NODE_ENV,
    'WebGL Support': checkWebGLSupport(),
    'WebSocket URL': process.env.NEXT_PUBLIC_WS_URL || 'Not configured',
  };

  console.group('%c🎮 MULTIPLY', 'color: #00c8ff; font-size: 16px; font-weight: bold;');
  console.table(info);
  console.groupEnd();

  console.log('%c💡 Tips:', 'color: #00c8ff; font-weight: bold;');
  console.log('• Connect your Sui wallet to get started');
  console.log('• Check the connection status in the top-right');
  console.log('• Open DevTools for performance metrics');
}

function checkWebGLSupport(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl ? '✓ Supported' : '✗ Not supported';
  } catch {
    return '✗ Not supported';
  }
}

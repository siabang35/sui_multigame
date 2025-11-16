'use client';

import { WalletProvider, SuiClientProvider } from '@mysten/dapp-kit';
import { SuiClient } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';

const queryClient = new QueryClient();

// Buat RPC client
const client = new SuiClient({
  url: 'https://fullnode.testnet.sui.io',
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={{
          testnet: { url: 'https://fullnode.testnet.sui.io' },
        }}
        defaultNetwork="testnet"
      >
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

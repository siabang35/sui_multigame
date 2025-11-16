'use client';

import { ConnectButton, useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import React, { useEffect, useState } from "react";
import { NetworkStatusIndicator } from "./network-status-indicator";

export function WalletConnect() {
  const currentAccount = useCurrentAccount();               // ← Sama seperti contoh Anda
  const client = useSuiClient();                            // RPC Client resmi
  const [balance, setBalance] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Load balance otomatis
  const loadBalance = async () => {
    if (!currentAccount) return;
    try {
      const res = await client.getBalance({
        owner: currentAccount.address,
      });

      setBalance(Number(res.totalBalance) / 1e9);
    } catch (err) {
      console.error("Failed to load balance:", err);
    }
  };

  useEffect(() => {
    loadBalance();
  }, [currentAccount]);

  return (
    <div className="flex items-center gap-2">
      {/* If wallet connected */}
      {currentAccount ? (
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-3 panel-dark px-4 py-2 rounded-lg hover:border-primary/80 transition-all"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="text-sm">
                <div className="text-xs opacity-70">Connected</div>
                <div className="font-mono text-primary">
                  {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
                </div>
              </div>
            </button>

            {showDetails && (
              <div className="absolute right-0 mt-2 w-80 bg-background border border-primary/30 rounded-lg shadow-lg z-50 p-4 space-y-3">
                <div className="space-y-2">
                  <div className="text-xs opacity-60 font-mono">ADDRESS</div>
                  <div className="font-mono text-xs break-all">
                    {currentAccount.address}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs opacity-60 font-mono flex justify-between">
                    <span>BALANCE</span>
                    <button
                      onClick={loadBalance}
                      className="text-primary hover:text-accent transition-colors"
                    >
                      ↻
                    </button>
                  </div>
                  <div className="text-lg font-bold text-accent">
                    {balance.toFixed(4)} SUI
                  </div>
                </div>

                <div className="border-t border-primary/30 pt-3">
                  <NetworkStatusIndicator />
                </div>

                <button
                  onClick={() => setShowDetails(false)}
                  className="w-full text-xs px-3 py-2 bg-primary/20 hover:bg-primary/30 rounded text-primary transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          <div className="text-right panel-dark px-4 py-2 rounded-lg">
            <div className="text-xs opacity-70">Balance</div>
            <div className="text-sm font-bold text-accent">
              {balance.toFixed(2)} SUI
            </div>
          </div>
        </div>
      ) : (
        <ConnectButton />      
      )}
    </div>
  );
}

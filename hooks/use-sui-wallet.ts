"use client";

import { useState, useCallback, useEffect } from "react";
import { suiGameService } from "@/lib/sui-game-service";
import { useGameStore } from "@/lib/game-state";

export function useSuiWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);

  const updateBlockchainSync = useGameStore(
    (state) => state.updateBlockchainSync
  );

  /** ----------------------------------------
   * AUTO-DETECT WALLET (COMPATIBLE WITH SLUSH)
   * ---------------------------------------- */
  const detectWallet = useCallback(async () => {
    if (typeof window === "undefined") return null;

    console.log('[wallet] Detecting available Sui wallets...');

    // Check for wallets immediately without waiting
    const wallets = [
      { name: "slush", obj: (window as any).slush},
      { name: "sui", obj: (window as any).sui },
      { name: "suiet", obj: (window as any).suiet },
      { name: "ethos", obj: (window as any).ethos },
      { name: "fewcha", obj: (window as any).fewcha },
      { name: "nightly", obj: (window as any).nightly },
    ];

    for (const w of wallets) {
      if (w.obj) {
        console.log("[wallet] Detected wallet:", w.name);
        return w.name;
      }
    }

    // If no wallet found immediately, wait a bit for injection
    let attempts = 0;
    const maxAttempts = 20; // 2 seconds total with 100ms intervals

    while (attempts < maxAttempts) {
      // Check for wallets again in case they were injected later
      const walletsDelayed = [
        { name: "slush", obj: (window as any).slush},
        { name: "sui", obj: (window as any).sui },
        { name: "suiet", obj: (window as any).suiet },
        { name: "ethos", obj: (window as any).ethos },
        { name: "fewcha", obj: (window as any).fewcha },
        { name: "nightly", obj: (window as any).nightly },
      ];

      for (const w of walletsDelayed) {
        if (w.obj) {
          console.log("[wallet] Detected wallet (delayed):", w.name);
          return w.name;
        }
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.warn('[wallet] No Sui wallet detected after 2 seconds');
    return null;
  }, []);

  /** ----------------------------------------
   * CHECK WALLET ON LOAD
   * ---------------------------------------- */
  useEffect(() => {
    const checkWallet = async () => {
      const type = await detectWallet();

      if (type) {
        setWalletType(type);
      } else {
        console.warn("[wallet] No wallet detected");
      }
    };

    checkWallet();
  }, [detectWallet]);

  /** ----------------------------------------
   * CONNECT WALLET (UNIVERSAL)
   * ---------------------------------------- */
  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      updateBlockchainSync("syncing");
      console.log("[wallet] Connecting...");

      // Make sure wallet is detected
      let detected = await detectWallet();
      if (!detected) {
        throw new Error("No Sui-compatible wallet found (Slush, Sui, Suiet, etc.)");
      }

      setWalletType(detected);

      /** 👉 UNIVERSAL CONNECT HANDLER */
      const addr = await suiGameService.connectWallet();
      setAddress(addr);

      const bal = await suiGameService.getBalance();
      setBalance(bal);

      updateBlockchainSync("connected");

      console.log("[wallet] Connected:", addr, "Type:", detected);
    } catch (err: any) {
      const msg = err?.message || "Connection failed";
      console.error("[wallet] Connection error:", msg);
      setError(msg);
      setAddress(null);
      updateBlockchainSync("disconnected");
    } finally {
      setIsConnecting(false);
    }
  }, [detectWallet, updateBlockchainSync]);

  /** ----------------------------------------
   * Refresh Balance
   * ---------------------------------------- */
  const refreshBalance = useCallback(async () => {
    if (!address) return;

    try {
      const bal = await suiGameService.getBalance();
      setBalance(bal);
    } catch (err: any) {
      setError(err?.message || "Balance refresh error");
    }
  }, [address]);

  /** ----------------------------------------
   * Auto-refresh every 30s
   * ---------------------------------------- */
  useEffect(() => {
    if (!address) return;

    refreshBalance();
    const id = setInterval(refreshBalance, 30000);

    return () => clearInterval(id);
  }, [address, refreshBalance]);

  return {
    address,
    balance,
    isConnecting,
    isConnected: !!address,
    error,
    connect,
    refreshBalance,
    walletType,
  };
}

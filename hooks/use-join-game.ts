import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiGameService } from '@/lib/sui-game-service';

const GAME_PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_GAME_PACKAGE_ID || '0x45ed0c095882c178f0744afd2eaa6298d9c065c8e73266ebf0df993cabe16a63';
const GAME_MODULE = 'game';

export function useJoinGame() {
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();

  const joinGame = async (gameId: string, username: string) => {
    if (!currentAccount) {
      throw new Error('No wallet connected');
    }

    console.log('[] Creating join game transaction for game:', gameId, 'username:', username);

    const tx = new Transaction();

    tx.moveCall({
      target: `${GAME_PACKAGE_ID}::${GAME_MODULE}::join_game`,
      arguments: [
        tx.object(gameId),
        tx.pure.string(username),
        tx.object('0x6'), // Sui clock object
      ],
    });

    console.log('[] Executing join game transaction...');
    const result = await signAndExecuteTransaction({
      transaction: tx,
    });

    console.log('[] Join transaction executed successfully:', result.digest);

    // Wait for the transaction to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch the player data after successful join
    console.log('[] Fetching player data for address:', currentAccount.address);
    const playerData = await suiGameService.getPlayerByAddress(gameId, currentAccount.address);

    console.log('[] Player data retrieved:', playerData);

    return {
      ...result,
      playerData,
    };
  };

  return { joinGame };
}

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');

  if (!gameId) {
    return Response.json(
      { error: 'gameId parameter required' },
      { status: 400 }
    );
  }

  try {
    const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
    const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl(SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet');
    const suiClient = new SuiClient({ url: SUI_RPC_URL });

    // Fetch leaderboard dari blockchain
    const obj = await suiClient.getObject({
      id: gameId,
      options: { showContent: true },
    });

    if (obj.data?.content?.dataType === 'moveObject') {
      const gameData = (obj.data.content.fields as any);
      
      // Parse player stats dari game state
      const leaderboard = gameData.top_scores?.map((entry: any) => ({
        address: entry[0],
        score: entry[1],
      })) || [];

      return Response.json({ 
        gameId,
        leaderboard,
        timestamp: Date.now(),
      });
    }

    return Response.json({ 
      gameId,
      leaderboard: [],
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[v0] Error fetching leaderboard:', error);
    return Response.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

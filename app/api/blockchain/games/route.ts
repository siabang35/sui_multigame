import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const gamePackageId = process.env.NEXT_PUBLIC_SUI_GAME_PACKAGE_ID || '0xbd9a853f1ff9317299044858bf4064e315a408e0d541f3481aaafbf06dd0d311';

export async function GET() {
  try {
    const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
    const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl(SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet');
    const suiClient = new SuiClient({ url: SUI_RPC_URL });

    // Fetch all games dari blockchain
    const games = await suiClient.queryTransactionBlocks({
      filter: {
        MoveFunction: {
          module: 'game',
          function: 'create_game',
          package: gamePackageId,
        },
      },
      limit: 50,
      order: 'descending',
    });

    const gamesList = [];

    for (const tx of games.data) {
      try {
        const txDetails = await suiClient.getTransactionBlock({
          digest: tx.digest,
          options: { showObjectChanges: true, showEffects: true },
        });

        if (txDetails.objectChanges) {
          for (const change of txDetails.objectChanges) {
            if (change.type === 'created' && change.objectType?.includes('Game')) {
              const obj = await suiClient.getObject({
                id: change.objectId,
                options: { showContent: true },
              });

              if (obj.data?.content?.dataType === 'moveObject') {
                const fields = (obj.data.content.fields as any);
                gamesList.push({
                  id: change.objectId,
                  name: Buffer.from(fields.name || '').toString('utf-8'),
                  creator: fields.creator,
                  isActive: fields.is_active,
                  createdAt: fields.created_at,
                  playerCount: fields.player_count,
                  maxPlayers: fields.max_players,
                  version: fields.version,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('[v0] Error processing game:', error);
      }
    }

    return Response.json({ 
      games: gamesList,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[v0] Error fetching games:', error);
    return Response.json(
      { error: 'Failed to fetch games from blockchain' },
      { status: 500 }
    );
  }
}

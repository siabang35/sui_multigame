import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const gamePackageId = process.env.NEXT_PUBLIC_SUI_GAME_PACKAGE_ID || '0xbd9a853f1ff9317299044858bf4064e315a408e0d541f3481aaafbf06dd0d311';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');
  const eventType = searchParams.get('eventType');

  try {
    const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
    const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl(SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet');
    const suiClient = new SuiClient({ url: SUI_RPC_URL });

    const events = await suiClient.queryEvents({
      query: {
        MoveModule: {
          module: 'game',
          package: gamePackageId,
        },
      },
      limit: 50,
      order: 'descending',
    });

    const filteredEvents = events.data
      .filter((event: any) => {
        if (eventType && !event.type.includes(eventType)) return false;
        if (gameId) {
          const parsed = typeof event.parsedJson === 'string' 
            ? JSON.parse(event.parsedJson)
            : event.parsedJson;
          if (parsed.game_id !== gameId) return false;
        }
        return true;
      })
      .map((event: any) => ({
        type: event.type.split('::').pop(),
        data: typeof event.parsedJson === 'string'
          ? JSON.parse(event.parsedJson)
          : event.parsedJson,
        timestamp: event.timestampMs,
        digest: event.id.txDigest,
      }));

    return Response.json({ 
      events: filteredEvents,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[v0] Error fetching events:', error);
    return Response.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

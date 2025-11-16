#[allow(lint(public_entry))]
module game_protocol::game {

    //
    // ===== Imports =====
    //
    use sui::clock;
    use sui::event;


    //
    // ===== Constants & Errors =====
    //
    const GAME_VERSION: u64 = 1;

    // errors used by functions
    const EGameNotActive: u64 = 1;
    const EInvalidMove: u64 = 4;
    const EGameFull: u64 = 5;

    //
    // ===== Structs =====
    //
    public struct Game has key {
        id: UID,
        name: vector<u8>,
        creator: address,
        is_active: bool,
        created_at: u64,
        player_count: u64,
        max_players: u64,
        version: u64,
    }

    public struct ScoreEntry has copy, drop, store {
        player: address,
        score: u64,
    }

    public struct Player has key {
        id: UID,
        game_id: ID, // was address
        player_address: address,
        username: vector<u8>,
        x: u64,
        y: u64,
        z: u64,
        health: u64,
        score: u64,
        kills: u64,
        deaths: u64,
        joined_at: u64,
        last_action_at: u64,
        is_alive: bool,
    }

    public struct GameLeaderboard has key {
        id: UID,
        game_id: ID, // was address
        top_scores: vector<ScoreEntry>,
        updated_at: u64,
    }

    public struct PlayerAction has key {
        id: UID,
        game_id: ID, // was address
        player_address: address,
        action_type: u64, // 0: move, 1: attack, 2: heal, 3: respawn
        timestamp: u64,
        x: u64,
        y: u64,
        z: u64,
    }

    //
    // ===== Event Definitions =====
    //
    public struct GameCreated has copy, drop {
        game_id: ID, // was address
        creator: address,
        name: vector<u8>,
        max_players: u64,
        timestamp: u64,
    }

    public struct PlayerJoined has copy, drop {
        game_id: ID, // was address
        player_address: address,
        username: vector<u8>,
        timestamp: u64,
    }

    public struct PlayerMoved has copy, drop {
        game_id: ID, // was address
        player_address: address,
        x: u64,
        y: u64,
        z: u64,
        timestamp: u64,
    }

    public struct PlayerAttacked has copy, drop {
        game_id: ID, // was address
        attacker: address,
        defender: address,
        damage: u64,
        timestamp: u64,
    }

    public struct PlayerRespawned has copy, drop {
        game_id: ID, // was address
        player_address: address,
        timestamp: u64,
    }

    public struct LeaderboardUpdated has copy, drop {
        game_id: ID, // was address
        top_scores: vector<ScoreEntry>,
        timestamp: u64,
    }

    public struct PlayerDied has copy, drop {
        game_id: ID, // was address
        player_address: address,
        killer: address,
        timestamp: u64,
    }

    //
    // ===== Admin Functions =====
    //
    public entry fun create_game(
        name: vector<u8>,
        max_players: u64,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ) {
        let game = Game {
            id: object::new(ctx),
            name,
            creator: tx_context::sender(ctx),
            is_active: true,
            created_at: clock::timestamp_ms(clock),
            player_count: 0,
            max_players,
            version: GAME_VERSION,
        };

        event::emit(GameCreated {
            game_id: object::id(&game),
            creator: tx_context::sender(ctx),
            name,
            max_players,
            timestamp: clock::timestamp_ms(clock),
        });

        transfer::share_object(game);
    }

    //
    // ===== Player Join =====
    //
    public entry fun join_game(
        game: &mut Game,
        username: vector<u8>,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ) {
        assert!(game.is_active, EGameNotActive);
        assert!(game.player_count < game.max_players, EGameFull);

        let player_address = tx_context::sender(ctx);

        let player = Player {
            id: object::new(ctx),
            game_id: object::id(game),
            player_address,
            username,
            x: 0,
            y: 0,
            z: 0,
            health: 100,
            score: 0,
            kills: 0,
            deaths: 0,
            joined_at: clock::timestamp_ms(clock),
            last_action_at: clock::timestamp_ms(clock),
            is_alive: true,
        };

        game.player_count = game.player_count + 1;

        event::emit(PlayerJoined {
            game_id: object::id(game),
            player_address,
            username,
            timestamp: clock::timestamp_ms(clock),
        });

        transfer::transfer(player, player_address);
    }

    //
    // ===== Movement =====
    //
    public entry fun move_player(
        game: &Game,
        player: &mut Player,
        new_x: u64,
        new_y: u64,
        new_z: u64,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ) {
        assert!(game.is_active, EGameNotActive);
        assert!(player.is_alive, EInvalidMove);

        player.x = new_x;
        player.y = new_y;
        player.z = new_z;
        player.last_action_at = clock::timestamp_ms(clock);

        let action = PlayerAction {
            id: object::new(ctx),
            game_id: object::id(game),
            player_address: player.player_address,
            action_type: 0,
            timestamp: clock::timestamp_ms(clock),
            x: new_x,
            y: new_y,
            z: new_z,
        };

        event::emit(PlayerMoved {
            game_id: object::id(game),
            player_address: player.player_address,
            x: new_x,
            y: new_y,
            z: new_z,
            timestamp: clock::timestamp_ms(clock),
        });

        transfer::transfer(action, player.player_address);
    }

    //
    // ===== Combat =====
    //
    public entry fun attack_player(
        game: &Game,
        attacker: &mut Player,
        defender: &mut Player,
        damage: u64,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ) {
        assert!(game.is_active, EGameNotActive);
        assert!(attacker.is_alive, EInvalidMove);
        assert!(defender.is_alive, EInvalidMove);

        let mut defender_died = false;

        if (defender.health > damage) {
            defender.health = defender.health - damage;
        } else {
            defender.health = 0;
            defender.is_alive = false;
            defender_died = true;

            attacker.kills = attacker.kills + 1;
            attacker.score = attacker.score + 100;
            defender.deaths = defender.deaths + 1;
        };

        attacker.last_action_at = clock::timestamp_ms(clock);

        event::emit(PlayerAttacked {
            game_id: object::id(game),
            attacker: attacker.player_address,
            defender: defender.player_address,
            damage,
            timestamp: clock::timestamp_ms(clock),
        });

        if (defender_died) {
            event::emit(PlayerDied {
                game_id: object::id(game),
                player_address: defender.player_address,
                killer: attacker.player_address,
                timestamp: clock::timestamp_ms(clock),
            });
        };

        let action = PlayerAction {
            id: object::new(ctx),
            game_id: object::id(game),
            player_address: attacker.player_address,
            action_type: 1,
            timestamp: clock::timestamp_ms(clock),
            x: attacker.x,
            y: attacker.y,
            z: attacker.z,
        };

        transfer::transfer(action, attacker.player_address);
    }

    //
    // ===== Respawn =====
    //
    public entry fun respawn_player(
        game: &Game,
        player: &mut Player,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ) {
        assert!(game.is_active, EGameNotActive);
        assert!(!player.is_alive, EInvalidMove);

        player.is_alive = true;
        player.health = 100;
        player.x = 50;
        player.y = 50;
        player.z = 0;
        player.last_action_at = clock::timestamp_ms(clock);

        event::emit(PlayerRespawned {
            game_id: object::id(game),
            player_address: player.player_address,
            timestamp: clock::timestamp_ms(clock),
        });

        let action = PlayerAction {
            id: object::new(ctx),
            game_id: object::id(game),
            player_address: player.player_address,
            action_type: 3,
            timestamp: clock::timestamp_ms(clock),
            x: 50,
            y: 50,
            z: 0,
        };

        transfer::transfer(action, player.player_address);
    }

    //
    // ===== Leaderboard =====
    //
    public fun update_leaderboard(
        game: &Game,
        top_scores: vector<ScoreEntry>,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ) {
        // touch fields of ScoreEntry so the compiler considers them used
        let len = vector::length(&top_scores);
        let mut i = 0;
        while (i < len) {
            let entry_ref = vector::borrow(&top_scores, i);
            // read fields to mark as used (no-op)
            let _player_addr = entry_ref.player;
            let _score_val = entry_ref.score;
            i = i + 1;
        };

        let leaderboard = GameLeaderboard {
            id: object::new(ctx),
            game_id: object::id(game),
            top_scores,
            updated_at: clock::timestamp_ms(clock),
        };

        event::emit(LeaderboardUpdated {
            game_id: object::id(game),
            top_scores: leaderboard.top_scores,
            timestamp: clock::timestamp_ms(clock),
        });

        transfer::share_object(leaderboard);
    }

    //
    // ===== Query =====
    //
    public fun get_player_health(player: &Player): u64 {
        player.health
    }

    public fun get_player_position(player: &Player): (u64, u64, u64) {
        (player.x, player.y, player.z)
    }

    public fun get_player_stats(player: &Player): (u64, u64, u64) {
        (player.score, player.kills, player.deaths)
    }

    public fun get_game_status(game: &Game): (bool, u64, u64) {
        (game.is_active, game.player_count, game.max_players)
    }

    public fun is_player_alive(player: &Player): bool {
        player.is_alive
    }

    //
    // ===== Game Management =====
    //
    public fun end_game(game: &mut Game) {
        game.is_active = false;
    }

    public fun leave_game(game: &mut Game) {
        if (game.player_count > 0) {
            game.player_count = game.player_count - 1;
        }
    }
}

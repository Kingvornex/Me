// server.js - Node.js WebSocket Server
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Game Server Class
class GameServer {
    constructor() {
        this.server = http.createServer();
        this.wss = new WebSocket.Server({ server: this.server });
        this.players = new Map();
        this.rooms = new Map();
        this.guilds = new Map();
        this.territories = new Map();
        this.marketplace = new Map();
        this.worldBosses = new Map();
        
        this.setupServer();
        this.initializeWorld();
    }
    
    setupServer() {
        this.server.listen(8080, () => {
            console.log('Game server running on port 8080');
        });
        
        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });
    }
    
    handleConnection(ws, req) {
        const playerId = this.generatePlayerId();
        const player = {
            id: playerId,
            ws: ws,
            name: `Player${playerId}`,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0 },
            health: 100,
            maxHealth: 100,
            level: 1,
            experience: 0,
            guild: null,
            spouse: null,
            children: [],
            house: null,
            inventory: [],
            equipment: {},
            skills: {},
            lastUpdate: Date.now()
        };
        
        this.players.set(playerId, player);
        
        ws.on('message', (message) => {
            this.handleMessage(playerId, message);
        });
        
        ws.on('close', () => {
            this.handleDisconnection(playerId);
        });
        
        // Send initial data
        this.sendToPlayer(playerId, {
            type: 'init',
            playerId: playerId,
            player: player,
            world: this.getWorldState()
        });
        
        // Broadcast new player to others
        this.broadcast({
            type: 'playerJoined',
            player: this.getPlayerData(playerId)
        }, playerId);
    }
    
    handleMessage(playerId, message) {
        try {
            const data = JSON.parse(message);
            const player = this.players.get(playerId);
            
            switch(data.type) {
                case 'move':
                    this.handleMove(playerId, data);
                    break;
                case 'chat':
                    this.handleChat(playerId, data);
                    break;
                case 'attack':
                    this.handleAttack(playerId, data);
                    break;
                case 'useAbility':
                    this.handleAbility(playerId, data);
                    break;
                case 'interact':
                    this.handleInteract(playerId, data);
                    break;
                case 'trade':
                    this.handleTrade(playerId, data);
                    break;
                case 'guild':
                    this.handleGuild(playerId, data);
                    break;
                case 'marriage':
                    this.handleMarriage(playerId, data);
                    break;
                case 'housing':
                    this.handleHousing(playerId, data);
                    break;
                case 'territory':
                    this.handleTerritory(playerId, data);
                    break;
            }
        } catch (error) {
            console.error('Message handling error:', error);
        }
    }
    
    handleMove(playerId, data) {
        const player = this.players.get(playerId);
        player.position = data.position;
        player.rotation = data.rotation;
        player.lastUpdate = Date.now();
        
        // Broadcast movement to nearby players
        this.broadcastToNearby(playerId, {
            type: 'playerMoved',
            playerId: playerId,
            position: data.position,
            rotation: data.rotation
        });
    }
    
    handleChat(playerId, data) {
        const player = this.players.get(playerId);
        const chatMessage = {
            type: 'chat',
            playerId: playerId,
            playerName: player.name,
            message: data.message,
            channel: data.channel || 'global',
            timestamp: Date.now()
        };
        
        if (data.channel === 'guild' && player.guild) {
            this.sendToGuild(player.guild, chatMessage);
        } else if (data.channel === 'trade') {
            this.sendToAll(chatMessage);
        } else {
            this.sendToAll(chatMessage);
        }
    }
    
    handleAttack(playerId, data) {
        const attacker = this.players.get(playerId);
        const target = this.players.get(data.targetId);
        
        if (target && this.isNearby(attacker, target)) {
            const damage = this.calculateDamage(attacker, target);
            target.health = Math.max(0, target.health - damage);
            
            this.sendToPlayer(playerId, {
                type: 'attackResult',
                targetId: data.targetId,
                damage: damage,
                targetHealth: target.health
            });
            
            this.sendToPlayer(data.targetId, {
                type: 'attacked',
                attackerId: playerId,
                damage: damage,
                health: target.health
            });
            
            if (target.health <= 0) {
                this.handleDeath(data.targetId, playerId);
            }
        }
    }
    
    handleGuild(playerId, data) {
        const player = this.players.get(playerId);
        
        switch(data.action) {
            case 'create':
                this.createGuild(playerId, data.guildName);
                break;
            case 'join':
                this.joinGuild(playerId, data.guildId);
                break;
            case 'leave':
                this.leaveGuild(playerId);
                break;
            case 'promote':
                this.promoteGuildMember(playerId, data.targetId);
                break;
            case 'kick':
                this.kickGuildMember(playerId, data.targetId);
                break;
            case 'war':
                this.declareGuildWar(playerId, data.targetGuildId);
                break;
        }
    }
    
    handleMarriage(playerId, data) {
        const player = this.players.get(playerId);
        const target = this.players.get(data.targetId);
        
        switch(data.action) {
            case 'propose':
                this.proposeMarriage(playerId, data.targetId);
                break;
            case 'accept':
                this.acceptMarriage(playerId, data.proposerId);
                break;
            case 'divorce':
                this.divorceMarriage(playerId);
                break;
            case 'haveChild':
                this.haveChild(playerId);
                break;
        }
    }
    
    handleHousing(playerId, data) {
        const player = this.players.get(playerId);
        
        switch(data.action) {
            case 'buy':
                this.buyHouse(playerId, data.houseType);
                break;
            case 'upgrade':
                this.upgradeHouse(playerId, data.upgradeType);
                break;
            case 'decorate':
                this.decorateHouse(playerId, data.decoration);
                break;
            case 'visit':
                this.visitHouse(playerId, data.targetPlayerId);
                break;
        }
    }
    
    handleTerritory(playerId, data) {
        const player = this.players.get(playerId);
        
        switch(data.action) {
            case 'claim':
                this.claimTerritory(playerId, data.territoryId);
                break;
            case 'attack':
                this.attackTerritory(playerId, data.territoryId);
                break;
            case 'defend':
                this.defendTerritory(playerId, data.territoryId);
                break;
        }
    }
    
    createGuild(playerId, guildName) {
        const player = this.players.get(playerId);
        const guildId = this.generateGuildId();
        
        const guild = {
            id: guildId,
            name: guildName,
            leader: playerId,
            members: [playerId],
            level: 1,
            experience: 0,
            gold: 0,
            territory: null,
            alliances: [],
            wars: [],
            created: Date.now()
        };
        
        this.guilds.set(guildId, guild);
        player.guild = guildId;
        
        this.sendToPlayer(playerId, {
            type: 'guildCreated',
            guild: guild
        });
        
        this.broadcast({
            type: 'guildAnnouncement',
            message: `${player.name} created the guild ${guildName}!`
        });
    }
    
    proposeMarriage(playerId, targetId) {
        const player = this.players.get(playerId);
        const target = this.players.get(targetId);
        
        if (target && !target.spouse) {
            this.sendToPlayer(targetId, {
                type: 'marriageProposal',
                proposerId: playerId,
                proposerName: player.name
            });
        }
    }
    
    acceptMarriage(playerId, proposerId) {
        const player = this.players.get(playerId);
        const proposer = this.players.get(proposerId);
        
        if (player && proposer && !player.spouse && !proposer.spouse) {
            player.spouse = proposerId;
            proposer.spouse = playerId;
            
            this.sendToPlayer(playerId, {
                type: 'marriageAccepted',
                spouseId: proposerId,
                spouseName: proposer.name
            });
            
            this.sendToPlayer(proposerId, {
                type: 'marriageAccepted',
                spouseId: playerId,
                spouseName: player.name
            });
            
            this.broadcast({
                type: 'marriageAnnouncement',
                message: `${player.name} and ${proposer.name} got married!`
            });
        }
    }
    
    haveChild(playerId) {
        const player = this.players.get(playerId);
        if (player.spouse) {
            const child = {
                id: this.generateChildId(),
                name: this.generateChildName(),
                parents: [playerId, player.spouse],
                age: 0,
                skills: {},
                born: Date.now()
            };
            
            player.children.push(child.id);
            const spouse = this.players.get(player.spouse);
            spouse.children.push(child.id);
            
            this.sendToPlayer(playerId, {
                type: 'childBorn',
                child: child
            });
            
            this.sendToPlayer(player.spouse, {
                type: 'childBorn',
                child: child
            });
        }
    }
    
    buyHouse(playerId, houseType) {
        const player = this.players.get(playerId);
        const housePrices = {
            starter: 1000,
            cottage: 5000,
            mansion: 20000,
            castle: 100000
        };
        
        const price = housePrices[houseType];
        if (player.gold >= price) {
            player.gold -= price;
            player.house = {
                type: houseType,
                level: 1,
                decorations: [],
                upgrades: []
            };
            
            this.sendToPlayer(playerId, {
                type: 'housePurchased',
                house: player.house
            });
        }
    }
    
    claimTerritory(playerId, territoryId) {
        const player = this.players.get(playerId);
        const territory = this.territories.get(territoryId);
        
        if (territory && !territory.owner) {
            territory.owner = playerId;
            territory.guild = player.guild;
            territory.claimed = Date.now();
            
            this.sendToPlayer(playerId, {
                type: 'territoryClaimed',
                territory: territory
            });
            
            this.broadcast({
                type: 'territoryAnnouncement',
                message: `${player.name} claimed ${territory.name}!`
            });
        }
    }
    
    // Helper methods
    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateGuildId() {
        return 'guild_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateChildId() {
        return 'child_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateChildName() {
        const names = ['Alex', 'Sam', 'Jordan', 'Casey', 'Riley'];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    calculateDamage(attacker, target) {
        const baseDamage = 10;
        const levelBonus = attacker.level * 2;
        const equipmentBonus = this.getEquipmentBonus(attacker);
        const defenseBonus = this.getDefenseBonus(target);
        
        return Math.max(1, baseDamage + levelBonus + equipmentBonus - defenseBonus);
    }
    
    getEquipmentBonus(player) {
        // Calculate bonus from equipment
        return 0;
    }
    
    getDefenseBonus(player) {
        // Calculate defense bonus
        return 0;
    }
    
    isNearby(player1, player2) {
        const distance = Math.sqrt(
            Math.pow(player1.position.x - player2.position.x, 2) +
            Math.pow(player1.position.z - player2.position.z, 2)
        );
        return distance < 10;
    }
    
    sendToPlayer(playerId, data) {
        const player = this.players.get(playerId);
        if (player && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(data));
        }
    }
    
    sendToAll(data) {
        this.players.forEach((player, playerId) => {
            this.sendToPlayer(playerId, data);
        });
    }
    
    sendToGuild(guildId, data) {
        const guild = this.guilds.get(guildId);
        if (guild) {
            guild.members.forEach(memberId => {
                this.sendToPlayer(memberId, data);
            });
        }
    }
    
    broadcast(data, excludePlayerId) {
        this.players.forEach((player, playerId) => {
            if (playerId !== excludePlayerId) {
                this.sendToPlayer(playerId, data);
            }
        });
    }
    
    broadcastToNearby(playerId, data) {
        const player = this.players.get(playerId);
        this.players.forEach((otherPlayer, otherPlayerId) => {
            if (playerId !== otherPlayerId && this.isNearby(player, otherPlayer)) {
                this.sendToPlayer(otherPlayerId, data);
            }
        });
    }
    
    getPlayerData(playerId) {
        const player = this.players.get(playerId);
        return {
            id: playerId,
            name: player.name,
            position: player.position,
            rotation: player.rotation,
            level: player.level,
            guild: player.guild
        };
    }
    
    getWorldState() {
        return {
            players: Array.from(this.players.values()).map(p => this.getPlayerData(p.id)),
            territories: Array.from(this.territories.values()),
            guilds: Array.from(this.guilds.values())
        };
    }
    
    initializeWorld() {
        // Initialize territories
        const territoryNames = ['Northern Plains', 'Eastern Forest', 'Southern Desert', 'Western Mountains'];
        territoryNames.forEach((name, index) => {
            this.territories.set(index, {
                id: index,
                name: name,
                owner: null,
                guild: null,
                resources: {
                    gold: 1000,
                    wood: 500,
                    food: 300
                },
                claimed: null
            });
        });
        
        // Initialize world bosses
        this.spawnWorldBoss();
        
        // Start weather system
        this.startWeatherSystem();
        
        // Start economy updates
        this.startEconomySystem();
    }
    
    spawnWorldBoss() {
        const boss = {
            id: 'world_boss_1',
            name: 'Ancient Dragon',
            health: 100000,
            maxHealth: 100000,
            position: { x: 1000, y: 0, z: 1000 },
            level: 50,
            lastSpawn: Date.now()
        };
        
        this.worldBosses.set(boss.id, boss);
        
        // Announce boss spawn
        setTimeout(() => {
            this.sendToAll({
                type: 'worldBossSpawned',
                boss: boss
            });
        }, 1000);
    }
    
    startWeatherSystem() {
        setInterval(() => {
            const weatherTypes = ['clear', 'rain', 'storm', 'snow', 'fog'];
            const weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
            
            this.sendToAll({
                type: 'weatherChanged',
                weather: weather
            });
        }, 300000); // Change weather every 5 minutes
    }
    
    startEconomySystem() {
        setInterval(() => {
            // Update marketplace prices
            this.marketplace.forEach((item, itemId) => {
                const fluctuation = (Math.random() - 0.5) * 0.1;
                item.price = Math.max(1, item.price * (1 + fluctuation));
            });
            
            // Send economy update
            this.sendToAll({
                type: 'economyUpdate',
                marketplace: Array.from(this.marketplace.values())
            });
        }, 60000); // Update every minute
    }
    
    handleDisconnection(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            // Save player data
            this.savePlayerData(playerId);
            
            // Remove from world
            this.players.delete(playerId);
            
            // Broadcast disconnection
            this.broadcast({
                type: 'playerLeft',
                playerId: playerId,
                playerName: player.name
            });
        }
    }
    
    savePlayerData(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            const playerData = {
                ...player,
                savedAt: Date.now()
            };
            
            // Save to database or file
            fs.writeFileSync(
                `saves/player_${playerId}.json`,
                JSON.stringify(playerData, null, 2)
            );
        }
    }
}

// Start the server
const gameServer = new GameServer();
module.exports = gameServer;

/* global describe, it, expect, beforeEach */
describe("Lobby", function() {
    var l = require('../Lobby.js').Lobby;
    var lobby;
    var webSocketServer = {};
    var repository = {
        persistUser: function(user) {}
    };

    webSocketServer.createSocketMessage = function(messageType, messageData) {
        return JSON.stringify({
            'messageType': messageType,
            'messageData': messageData
        });
    };

    webSocketServer.broadcastMessage = function() {};

    beforeEach(function() {
        lobby = new l(webSocketServer, repository);
    });


    describe("onNewClient", function() {
        it("can add new clients", function() {
            var client = {
                'user': {
                    'userName': 'User1'
                },
                'socket': '',
                'game': ''
            };

            webSocketServer.onNewClient(client);
            expect(lobby.clients.length).toEqual(1);
        });
    });

    describe("onClientClose", function() {
        it("can remove old clients", function() {
            lobby.clients = [{
                'user': {
                    'userName': 'User1'
                },
                'socket': '',
                'game': ''
            }];
            var fakeSocket = '';

            webSocketServer.onClientClose(fakeSocket);
            expect(lobby.clients.length).toEqual(0);
        });
    });


    describe("getClientBySocket", function() {
        it("can find a client associated with a socket", function() {
            var fakeSocket1 = {
                item: 'blah'
            };
            var fakeSocket2 = {
                item: 'foo'
            };
            lobby.clients = [{
                'user': {
                    'userName': 'User1'
                },
                'socket': fakeSocket1
            }, {
                'user': {
                    'userName': 'User2'
                },
                'socket': fakeSocket2
            }];
            var client = lobby.getClientBySocket(fakeSocket2);
            expect(client.user.userName).toBe('User2');
        });

        it("will return no player if a socket is not associated with one", function() {
            var fakeSocket = {};
            var client = lobby.getClientBySocket(fakeSocket);
            expect(client).toBe(undefined);
        });
    });

    describe("getClientByUserName", function() {
        it("can find a client associated with a username", function() {
            var fakeSocket1 = {
                item: 'blah'
            };
            var fakeSocket2 = {
                item: 'foo'
            };
            lobby.clients = [{
                'user': {
                    'userName': 'User1'
                },
                'socket': fakeSocket1
            }, {
                'user': {
                    'userName': 'User2'
                },
                'socket': fakeSocket2
            }];
            var client = lobby.getClientByUserName('User2');
            expect(client).toEqual({
                'user': {
                    'userName': 'User2'
                },
                'socket': fakeSocket2
            });
        });
    });

    describe("createGame", function() {
        it("can host multiple games", function() {
            lobby.createGame([]);
            lobby.createGame([]);

            expect(lobby.games.length).toBe(2);
        });
    });

    describe("onClientChallenge", function() {
        it("allows clients to challenge other clients", function() {

            var challengerSocket = {
                send: function() {},
                item: 'foo'
            };
            var challengedSocket = {
                send: function() {},
                item: 'bar'
            };


            lobby.clients = [{
                'user': {
                    'userName': 'User1'
                },
                'socket': challengerSocket,
                'game': null
            }, {
                'user': {
                    'userName': 'User2'
                },
                'socket': challengedSocket,
                'game': null
            }];

            webSocketServer.onClientChallenge(challengerSocket, 'User2');

            expect(lobby.games.length).toBe(1);
            expect(lobby.clients.map(function(client) {
                return client.game;
            })).toEqual([lobby.games[0], lobby.games[0]]);
        });

        it("prevents clients from challenging themselves", function() {
            var challengerSocket = {
                send: function() {},
                item: 'foo'
            };

            lobby.clients.push({
                'user': {
                    'userName': 'User1'
                },
                'socket': challengerSocket,
                'game': null
            });
            webSocketServer.sendMessage = function() {};

            webSocketServer.onClientChallenge(challengerSocket, 'User1');

            expect(lobby.games.length).toBe(0);
            expect(lobby.clients[0].game).toEqual(null);
        });

        it("prevent clients from challenging other in-game clients", function() {
            var challengerSocket = {
                send: function() {},
                item: 'foo'
            };
            var challengedSocket = {
                send: function() {},
                item: 'bar'
            };
            lobby.clients.push({
                'user': {
                    'userName': 'User1'
                },
                'socket': challengerSocket,
                'game': null
            }, {
                'user': {
                    'userName': 'User2'
                },
                'socket': challengedSocket,
                'game': 'in-game'
            });
            webSocketServer.sendMessage = function() {};

            webSocketServer.onClientChallenge(challengerSocket, 'User2');

            expect(lobby.games.length).toBe(0);
            expect(lobby.clients.map(function(client) {
                return client.game;
            })).toEqual([null, 'in-game']);
        });
    });

    it("can close games", function() {
        var game = {};
        game.clients = [{
            'user': {
                'userName': 'User1'
            },
            'socket': '',
            'game': 'game'
        }, {
            'user': {
                'userName': 'User2'
            },
            'socket': '',
            'game': 'in-game'
        }];

        lobby.games = [game, 'game2', 'game3', 'game4'];
        lobby.closeGame(game);

        expect(lobby.games.length).toBe(3);
        expect(lobby.games[2]).toBe('game4');
    });

});